% TabSINT Results Processor for MATLAB
%
% Provides key generation and decryption of encrypted open-hearing-tabsint results.
%
% Encryption scheme:
%   - AES-256-CBC: encrypts result data; a random 16-byte IV is prepended to
%     the ciphertext and the combined bytes are base64-encoded (.json.enc)
%   - RSA-OAEP (SHA-256): encrypts the raw 32-byte AES key; result is
%     base64-encoded (.json.key.enc)
%   - Key derivation: PBKDF2-SHA-256 (100,000 iterations) from testDateTime + device UUID
%
% Requires openssl on the system PATH.
%
% EXAMPLE WORKFLOW:
%   tr = TabsintResults;
%
%   % One-time: generate a key pair and copy the public key into your protocol
%   publickey = tr.generatekey();           % saves tabsint.pem + tabsint.pub
%
%   % Later: decrypt a folder of results
%   cd('/path/to/encrypted/results');
%   tr.decrypt();                           % uses any *.pem in current directory
%   tr.decrypt('mykey.pem');                % or specify explicitly

classdef TabsintResults < handle

    properties (GetAccess=public, SetAccess=private)
        privatekey;
        publickey;
    end

    methods

        %% Constructor
        function this = TabsintResults()
        end

        %% generatekey
        function publickey = generatekey(this, varargin)
        % generatekey  Generate an RSA-2048 key pair for use with open-hearing-tabsint.
        %
        % Returns the public key string to insert into the `publicKey` field
        % of a tabsint protocol.  Saves a private key file (.pem) and a public
        % key file (.pub) in the current directory.  Keep the .pem file secure.
        %
        % USAGE:
        %   tr = TabsintResults;
        %   publickey = tr.generatekey();            % uses 'tabsint.pem'
        %   publickey = tr.generatekey('mykey.pem'); % custom private key name

            this.checkopenssl();

            if ~isempty(varargin)
                if ischar(varargin{1})
                    privatekeyFilename = varargin{1};
                else
                    error('TabsintResults:generatekey', 'Input filename must be a string.');
                end
            else
                privatekeyFilename = 'tabsint.pem';
            end

            publickeyFilename = [privatekeyFilename(1:end-4), '.pub'];

            this.trlog(['private key: ', privatekeyFilename]);
            this.trlog(['public key:  ', publickeyFilename]);

            if isempty(dir(privatekeyFilename))
                this.opensslcmd(['openssl genrsa -out ', privatekeyFilename, ' 2048']);
            else
                this.trlog([privatekeyFilename, ' already exists — reusing.']);
            end

            this.opensslcmd(['openssl rsa -in ', privatekeyFilename, ' -pubout -out ', publickeyFilename]);

            this.privatekey = privatekeyFilename;
            this.publickey  = publickeyFilename;
            publickey = fileread(publickeyFilename);
        end

        %% decrypt
        function decrypt(this, varargin)
        % decrypt  Decrypt encrypted result files in the current directory.
        %
        % Processes all *.json.key.enc / *.json.enc file pairs found in the
        % current directory.  Each pair is decrypted to a plain *.json file.
        % Intermediate temporary files are removed after decryption.
        %
        % USAGE:
        %   tr = TabsintResults;
        %   tr.decrypt();               % auto-detects *.pem in current directory
        %   tr.decrypt('mykey.pem');    % specify private key explicitly

            this.checkopenssl();

            % Resolve private key
            if ~isempty(varargin)
                if ischar(varargin{1})
                    this.privatekey = varargin{1};
                else
                    error('TabsintResults:decrypt', 'Private key filename must be a string.');
                end
            else
                pemFiles = dir('*.pem');
                if isempty(pemFiles)
                    error('TabsintResults:decrypt', 'No *.pem file found in current directory.');
                elseif length(pemFiles) > 1
                    error('TabsintResults:decrypt', ...
                        'More than one *.pem file found — pass the key name explicitly: tr.decrypt(''mykey.pem'').');
                else
                    this.privatekey = pemFiles(1).name;
                end
            end

            this.trlog(['Using private key: ', this.privatekey]);

            % Find all encrypted result files
            encFiles = dir('*.json.enc');
            if isempty(encFiles)
                this.trlog('No *.json.enc files found.');
                return;
            end

            % Ensure files transferred from Android (often read-only) are readable
            fileattrib('*.json.enc',     '+w');
            fileattrib('*.json.key.enc', '+w');

            for i = 1:length(encFiles)
                encFilename    = encFiles(i).name;
                % *.json.enc  ->  *.json
                resultFilename = encFilename(1:end-4);
                % *.json      ->  *.json.key.enc
                keyEncFilename = [resultFilename, '.key.enc'];

                if ~exist(keyEncFilename, 'file')
                    this.trlog(['WARNING: no key file found for ', encFilename, ' — skipping.']);
                    continue;
                end

                this.trlog(['Decrypting: ', encFilename]);

                % --- Temp file names ---
                keyBinFile    = [encFilename, '.keybin.tmp'];
                aesKeyFile    = [encFilename, '.aeskey.tmp'];
                encBinFile    = [encFilename, '.encbin.tmp'];
                cipherFile    = [encFilename, '.cipher.tmp'];

                try
                    % Step 1: Base64-decode the encrypted AES key
                    this.opensslcmd(['openssl base64 -d -A -in ', keyEncFilename, ' -out ', keyBinFile]);

                    % Step 2: RSA-OAEP-SHA256 decrypt the AES key -> raw 32 bytes
                    this.opensslcmd(['openssl pkeyutl -decrypt -inkey ', this.privatekey, ...
                        ' -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256', ...
                        ' -in ', keyBinFile, ' -out ', aesKeyFile]);

                    % Step 3: Read AES key bytes and convert to hex string
                    fid = fopen(aesKeyFile, 'rb');
                    keyBytes = fread(fid, Inf, 'uint8');
                    fclose(fid);
                    if length(keyBytes) ~= 32
                        error('TabsintResults:decrypt', ...
                            'Decrypted AES key is %d bytes; expected 32.', length(keyBytes));
                    end
                    keyHex = reshape(dec2hex(keyBytes, 2)', 1, []);

                    % Step 4: Base64-decode the encrypted result (IV prepended to ciphertext)
                    this.opensslcmd(['openssl base64 -d -A -in ', encFilename, ' -out ', encBinFile]);

                    % Step 5: Read binary, split IV (first 16 bytes) from ciphertext
                    fid = fopen(encBinFile, 'rb');
                    allBytes = fread(fid, Inf, 'uint8');
                    fclose(fid);
                    if length(allBytes) < 17
                        error('TabsintResults:decrypt', ...
                            'Encrypted file %s is too short to contain an IV.', encFilename);
                    end
                    ivHex        = reshape(dec2hex(allBytes(1:16),   2)', 1, []);
                    cipherBytes  = allBytes(17:end);

                    % Step 6: Write ciphertext to temp file
                    fid = fopen(cipherFile, 'wb');
                    fwrite(fid, cipherBytes, 'uint8');
                    fclose(fid);

                    % Step 7: AES-256-CBC decrypt with raw key and IV
                    this.opensslcmd(['openssl enc -d -nosalt -aes-256-cbc', ...
                        ' -K ', keyHex, ' -iv ', ivHex, ...
                        ' -in ', cipherFile, ' -out ', resultFilename]);

                    this.trlog(['  -> ', resultFilename]);

                catch e
                    this.trlog(['ERROR decrypting ', encFilename, ': ', e.message]);
                end

                % Cleanup temp files regardless of success/failure
                for tmpFile = {keyBinFile, aesKeyFile, encBinFile, cipherFile}
                    if exist(tmpFile{1}, 'file')
                        delete(tmpFile{1});
                    end
                end
            end
        end

    end % methods

    %% Private helpers
    methods (Access=private)

        function trlog(~, msg)
            fprintf('[TabsintResults] %s\n', msg);
        end

        function checkopenssl(this)
            [status, ~] = system('openssl version');
            if status ~= 0
                error('TabsintResults:checkopenssl', ...
                    'openssl not found on PATH. Install openssl and ensure it is accessible.');
            end
        end

        function opensslcmd(this, cmd)
            [status, stdout] = system(cmd);
            if status ~= 0
                this.trlog(['Command failed: ', cmd]);
                this.trlog(['Output: ', stdout]);
                error('TabsintResults:opensslcmd', 'openssl command failed: %s', cmd);
            end
        end

    end % private methods

end
