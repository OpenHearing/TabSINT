function generate_impulse_noise_csv(sessionFile, outputDir)
%GENERATE_IMPULSE_NOISE_CSV  Convert one DuoDose session into a DOEHRS-IH
%   impulse-noise CSV (one CSV file per session).
%
%   generate_impulse_noise_csv(SESSIONFILE, OUTPUTDIR) reads the session data
%   in SESSIONFILE, applies the impulse-noise reporting rules below, and writes
%   <session-name>.csv into OUTPUTDIR .
%
%   Reporting rules
%   ---------------
%   Each detected impulse/event has its own peak sound pressure level (dB).
%   Events are classified per-event:
%
%     * Peak < 170 dB  -> accumulated into bins and reported as ONE row per
%                         non-empty bin (140-150, 150-160, 160-170).
%                         When a bin holds more than one event, Peak Sound
%                         Pressure Level is the bin center (145 / 155 / 165),
%                         the row's timestamp is the start of the 1-hour window
%                         the events fall in, and Analysis Description is
%                         populated. When a bin holds exactly one event, Peak
%                         Sound Pressure Level is that event's actual level,
%                         the row's timestamp is that event's actual timestamp,
%                         and Analysis Description is blank. Number Of Events =
%                         count in the bin. Empty bins produce no row.
%
%     * Peak >= 170 dB -> ONE row per event. Peak Sound Pressure Level is the
%                         event's actual value, the row's timestamp is the
%                         event's actual timestamp, Number Of Events = 1, and
%                         Analysis Description is left blank.
%
%   Each row's timestamp (UTC, from the session file) is written as:
%     Event Date = yyyy/MM/dd
%     Sync Date  = yyyy/MM/dd
%     Sync Time  = HH:mm:ss.SSSZ   (e.g. 16:35:40.640Z)
%   For a multi-event bin, the timestamp is the start of the 1-hour window and
%   Sync Time is the window as a range: "HH:mm:ssZ to HH:mm:ssZ"
%   (e.g. 16:11:30Z to 17:11:30Z).
%
%     * No peaks -> no data rows (header-only file).
%
%   The 140-170 bins reset every 1-hour window (measured from the session
%   "Start DateTime:"), so a session longer than 1 hour produces a fresh set of
%   bin rows for each hour that contains impulses.
%
%   Constant fields (always the same):
%     Recorder Unique ID SN   = None
%     Recorder Manufacturer   = Creare
%     Recorder Model          = DuoDose
%     Calibrator Unique ID SN = None
%     Calibrator Manufacturer = Creare
%     Calibrator Model        = None
%     Microphone Unique ID SN = None
%     Microphone Manufacturer = GRAS Sound & Vibration
%     Microphone Model        = 48LA
%     Microphone Diameter     = 1/4 inch
%     Sampling Rate           = 96000
%     Analysis Description    = "If number of events is greater than 1, then the
%                                events are within 5dB of the peak and the sync
%                                time is the 1 hour period when the events
%                                happened."

    if nargin < 2 || isempty(outputDir)
        outputDir = pwd;
    end
    if ~exist(outputDir, 'dir')
        mkdir(outputDir);
    end

    % --- Parse the session --------------------------------------------------
    session = parseSessionData(sessionFile);

    % --- Build the output rows from the events ------------------------------
    rows = buildImpulseRows(session);

    % --- Write the CSV ------------------------------------------------------
    [~, baseName] = fileparts(sessionFile);
    outFile = fullfile(outputDir, [baseName '.csv']);
    writeDoehrsCsv(outFile, rows, session);
    fprintf('Wrote %d data row(s) to %s\n', numel(rows), outFile);
end


% =========================================================================
%  Configuration / constants
% =========================================================================
function c = config()
    c.PEAK_THRESHOLD   = 170;          % dB; >= this is reported per-event
    c.BIN_EDGES        = [140 150 160 170];   % bin boundaries (lower..upper)
    c.BIN_CENTERS      = [145 155 165];       % reported peak per bin
    c.SAMPLING_RATE    = 96000;
    c.MANUFACTURER     = 'Creare';
    c.RECORDER_MODEL   = 'DuoDose';
    c.MIC_MANUFACTURER = 'GRAS Sound & Vibration';
    c.MIC_MODEL        = '48LA';
    c.MIC_DIAMETER     = '1/4 inch';
    c.NONE            = 'None';       % value for fields with no information
    c.ANALYSIS_NOTE    = ['If number of events is greater than 1, then the ' ...
                          'events are within 5dB of the peak and the sync ' ...
                          'time is the 1 hour period when the events ' ...
                          'happened.'];
end


% =========================================================================
%  Session parsing  (DuoDose "Summary" CSV format)
% =========================================================================
function session = parseSessionData(sessionFile)
%PARSESESSIONDATA  Read a DuoDose "Summary" session CSV and normalize it.
%
%   Returns:
%     session.times     : cell array (parallel to peaks) of the verbatim ISO
%                         timestamp of each impulse, used for per-row Event Date
%                         and Sync Date/Time.
%     session.startDn   : session start datenum, for 1-hour window bounds.
%     session.peaks     : numeric vector of per-impulse peak levels (dB). Each
%                         1-second row contributes one entry per impulse
%                         (Num Impulses copies of that row's Peak Level), so a
%                         second with 2 impulses adds 2 entries. Rows with
%                         Num Impulses = 0 are ignored -- their Peak Level is an
%                         ambient/non-impulse reading, not an event.
%     session.hourIdx   : integer vector, parallel to peaks, giving the
%                         1-hour window (0-based) each impulse falls in, counted
%                         from "Start DateTime:". The 140-170 bins are reset per
%                         window, so a session longer than 1 hour produces a
%                         fresh set of bin rows for each hour that has impulses.
%     session.leq8hr    : '' -- the Summary file has no 8-hour Leq (only
%                         per-second LAeq/LCeq/LZeq). Leq 8hr comes from a
%                         separate file/analysis; left blank for now.

    lines = readFileLines(sessionFile);

    startDt = '';
    headerIdx = 0;
    for i = 1:numel(lines)
        ln = lines{i};
        if startsWith(strtrim(ln), 'Start DateTime:')
            parts = strsplit(ln, ',');
            if numel(parts) >= 2
                startDt = strtrim(parts{2});
            end
        end
        if regexp(ln, '^\s*DateTime\s*,', 'once')
            headerIdx = i;
            break;
        end
    end
    if headerIdx == 0
        error('parseSessionData:noHeader', ...
            'Could not find the "DateTime," column header in %s.', sessionFile);
    end

    if isempty(startDt)
        error('parseSessionData:noStartDateTime', ...
            'Could not find "Start DateTime:" in %s.', sessionFile);
    end
    startDn = isoToDatenum(startDt);   % full timestamp, for hour windows

    hdr = strtrim(strsplit(lines{headerIdx}, ','));
    hdr = regexprep(hdr, '^"(.*)"$', '$1');
    impCol  = find(strcmpi(hdr, 'Num Impulses'), 1);
    peakCol = find(startsWith(hdr, 'Peak Level'), 1);
    if isempty(impCol) || isempty(peakCol)
        error('parseSessionData:missingColumns', ...
            'Could not locate "Num Impulses" and/or "Peak Level" columns.');
    end

    peaks   = [];
    hourIdx = [];
    times   = {};
    for i = headerIdx+1 : numel(lines)
        parts = strsplit(lines{i}, ',', 'CollapseDelimiters', false);
        parts = strtrim(parts);
        parts = regexprep(parts, '^"(.*)"$', '$1');   % strip surrounding quotes

        if numel(parts) < max(impCol, peakCol)
            continue;
        end
        ts = parts{1};
        % Data rows start with an ISO timestamp; the units row does not.
        if isempty(regexp(ts, '^\d{4}-\d{2}-\d{2}T', 'once'))
            continue;
        end
        nImp = str2double(parts{impCol});
        peak = str2double(parts{peakCol});
        if isnan(nImp) || nImp < 1 || isnan(peak)
            continue;   % no impulse in this second
        end
        nImp = round(nImp);
        % 1-hour window (0-based) measured from the session start.
        h = floor((isoToDatenum(ts) - startDn) * 24);
        peaks   = [peaks;   repmat(peak, nImp, 1)]; %#ok<AGROW>
        hourIdx = [hourIdx; repmat(h,    nImp, 1)]; %#ok<AGROW>
        times(end+1:end+nImp) = {ts};               %#ok<AGROW>  per-impulse timestamp
    end

    session.peaks   = peaks;
    session.hourIdx = hourIdx;
    session.times   = times(:);   % verbatim ISO timestamp per impulse
    session.startDn = startDn;    % session start, for 1-hour window bounds
    session.leq8hr  = '';   % comes from a separate file; blank for now
end


function dn = isoToDatenum(s)
%ISOTODATENUM  Parse "yyyy-mm-ddTHH:MM:SS(.fff)(Z)" to a MATLAB datenum,
%   keeping milliseconds when present.
    s = strtrim(s);
    s = strrep(s, '"', '');   % remove any surrounding quotes
    dn = datenum(s(1:19), 'yyyy-mm-ddTHH:MM:SS');
    ms = regexp(s, '^.{19}\.(\d+)', 'tokens', 'once');
    if ~isempty(ms)
        dn = dn + str2double(['0.' ms{1}]) / 86400;
    end
end


function lines = readFileLines(file)
    fid = fopen(file, 'r');
    if fid < 0
        error('parseSessionData:cannotOpen', 'Could not open %s.', file);
    end
    cleaner = onCleanup(@() fclose(fid)); %#ok<NASGU>
    lines = {};
    ln = fgetl(fid);
    while ischar(ln)
        lines{end+1} = ln; %#ok<AGROW>
        ln = fgetl(fid);
    end
end


% =========================================================================
%  Row construction
% =========================================================================
function rows = buildImpulseRows(session)
    c = config();
    peaks   = session.peaks(:);
    hourIdx = session.hourIdx(:);
    times   = session.times(:);
    startDn = session.startDn;

    keep    = ~isnan(peaks);
    peaks   = peaks(keep);
    hourIdx = hourIdx(keep);
    times   = times(keep);

    % Warn about anything below the lowest bin (not counted in any bin).
    nUnbinned = sum(peaks < c.PEAK_THRESHOLD & peaks < c.BIN_EDGES(1));
    if nUnbinned > 0
        warning('generate_impulse_noise_csv:belowLowestBin', ...
            '%d event(s) below %g dB are not assigned to any bin.', ...
            nUnbinned, c.BIN_EDGES(1));
    end

    rows = struct('peakSPL', {}, 'numEvents', {}, 'eventDn', {}, ...
                  'eventEndDn', {}, 'analysisDesc', {});

    % The 140-170 bins reset every 1-hour window, so process each hour that
    % contains impulses in chronological order. Within a window: emit the
    % non-empty bin rows, then one row per >=170 event.
    for hr = sort(unique(hourIdx))'
        sel    = find(hourIdx == hr);
        hp     = peaks(sel);
        htimes = times(sel);

        % --- Below-threshold events: accumulate into bins ----------------
        for k = 1:numel(c.BIN_CENTERS)
            lo = c.BIN_EDGES(k);
            hi = c.BIN_EDGES(k+1);      % upper edge is exclusive: [lo, hi)
            inBin = hp >= lo & hp < hi & hp < c.PEAK_THRESHOLD;
            count = sum(inBin);
            if count == 0
                continue;               % empty bins produce no row
            end
            r.numEvents = count;
            if count > 1
                r.peakSPL      = c.BIN_CENTERS(k);          % bin center
                r.eventDn      = startDn + hr/24;       % 1-hour window start
                r.eventEndDn   = startDn + (hr+1)/24;   % 1-hour window end
                r.analysisDesc = c.ANALYSIS_NOTE;
            else
                vals           = hp(inBin);
                ts             = htimes(inBin);
                r.peakSPL      = vals(1);    % single peak: actual level
                r.eventDn      = isoToDatenum(ts{1});  % single peak: actual time
                r.eventEndDn   = [];
                r.analysisDesc = '';
            end
            rows(end+1) = r; %#ok<AGROW>
        end

        % --- At/above threshold: one row per event -----------------------
        aboveSel = find(hp >= c.PEAK_THRESHOLD);
        [~, ord] = sort(hp(aboveSel));
        aboveSel = aboveSel(ord);
        for k = 1:numel(aboveSel)
            r.peakSPL      = hp(aboveSel(k));
            r.numEvents    = 1;
            r.eventDn      = isoToDatenum(htimes{aboveSel(k)});  % actual time
            r.eventEndDn   = [];
            r.analysisDesc = '';
            rows(end+1) = r; %#ok<AGROW>
        end
    end
end


function s = formatDate(dn)
%FORMATDATE  yyyy/MM/dd, used for Event Date and Sync Date.
    s = datestr(dn, 'yyyy/mm/dd');
end


function s = formatTime(dn, fmt)
%FORMATTIME  UTC time of day for Sync Time, e.g. "16:35:40.640Z" with
%   fmt 'HH:MM:SS.FFF', or "16:11:30Z" with fmt 'HH:MM:SS'. The trailing Z
%   also keeps Excel from converting the value to a number/time.
%   Rounds to the nearest millisecond first so the date and time agree.
    dn = round(dn * 86400000) / 86400000;
    s = [datestr(dn, fmt) 'Z'];
end


% =========================================================================
%  CSV writing  (87-column DOEHRS-IH layout)
% =========================================================================
function writeDoehrsCsv(outFile, rows, session)
    c = config();
    headers = doehrsHeaders();
    nCols = numel(headers);

    fid = fopen(outFile, 'w');
    if fid < 0
        error('generate_impulse_noise_csv:cannotOpen', ...
            'Could not open %s for writing.', outFile);
    end
    cleaner = onCleanup(@() fclose(fid));

    % Header row
    fprintf(fid, '%s\n', strjoin(cellfun(@csvEscape, headers, ...
        'UniformOutput', false), ','));

    % Resolve column indices once
    col = @(name) find(strcmp(headers, name), 1);
    iRecMfr  = col('Recorder Manufacturer');
    iRecMdl  = col('Recorder Model');
    iCalMfr  = col('Calibrator Manufacturer');
    iMicMfr  = col('Microphone Manufacturer');
    iPeak    = col('Peak Sound Pressure Level');
    iNumEvt  = col('Number Of Events');
    iSamp    = col('Sampling Rate');
    iAnalys  = col('Analysis Description');
    iEvtDate = col('Event Date');
    iLeq8    = col('Leq 8hr');
    iSyncDt  = col('Sync Date');
    iSyncTm  = col('Sync Time');
    noneCols = cellfun(col, {'Recorder Unique ID SN', ...
        'Calibrator Unique ID SN', 'Calibrator Model', ...
        'Microphone Unique ID SN'});
    iMicMdl  = col('Microphone Model');
    iMicDia  = col('Microphone Diameter');

    % Leq 8hr comes from a separate file. Event Date / Sync Date / Sync Time
    % are per-row (an event's timestamp, or for multi-event bins the start
    % date of the 1-hour window and a "start to end" Sync Time range).
    if isfield(session, 'leq8hr') && ~isempty(session.leq8hr)
        leqStr = num2str(session.leq8hr);
    else
        leqStr = '';
    end

    for i = 1:numel(rows)
        cells = repmat({''}, 1, nCols);
        cells(noneCols) = {c.NONE};
        cells{iRecMfr} = c.MANUFACTURER;
        cells{iRecMdl} = c.RECORDER_MODEL;
        cells{iCalMfr} = c.MANUFACTURER;
        cells{iMicMfr} = c.MIC_MANUFACTURER;
        cells{iMicMdl} = c.MIC_MODEL;
        cells{iMicDia} = c.MIC_DIAMETER;
        cells{iSamp}   = num2str(c.SAMPLING_RATE);
        cells{iEvtDate} = formatDate(rows(i).eventDn);
        cells{iSyncDt}  = formatDate(rows(i).eventDn);
        if isempty(rows(i).eventEndDn)
            cells{iSyncTm} = formatTime(rows(i).eventDn, 'HH:MM:SS.FFF');
        else
            cells{iSyncTm} = [formatTime(rows(i).eventDn, 'HH:MM:SS') ...
                ' to ' formatTime(rows(i).eventEndDn, 'HH:MM:SS')];
        end
        cells{iLeq8}    = leqStr;
        cells{iPeak}    = num2str(rows(i).peakSPL);
        cells{iNumEvt}  = num2str(rows(i).numEvents);
        cells{iAnalys}  = rows(i).analysisDesc;

        fprintf(fid, '%s\n', strjoin(cellfun(@csvEscape, cells, ...
            'UniformOutput', false), ','));
    end
end


function s = csvEscape(s)
    if ~ischar(s) && ~isstring(s)
        s = num2str(s);
    end
    s = char(s);
    if any(s == ',') || any(s == '"') || any(s == newline) || any(s == sprintf('\r'))
        s = ['"' strrep(s, '"', '""') '"'];
    end
end


% =========================================================================
%  DOEHRS-IH column headers (87 columns, "CSV Import Example" order)
% =========================================================================
function h = doehrsHeaders()
    h = { ...
        'Course School UIC', 'Event Date', 'Collector First Name', ...
        'Collector Last Name', 'Collector Email', 'Collector Phone Number', ...
        'Collector Unit', 'Sample Reason', 'Exposure Notes', 'EDIPI', ...
        'Service Member UIC', 'Work Shift', 'Exposure Time', 'Helmet ID', ...
        'Helmet Description', 'Shield ID', 'Shield Description', 'Armor ID', ...
        'Armor Description', 'Body Protection Comments', 'Plugs ID', ...
        'Plug Use', 'Muffs ID', 'Muff Use', 'Hearing Protection Comments', ...
        'Recorder Unique ID SN', 'Recorder Manufacturer', 'Recorder Model', ...
        'Calibrator Unique ID SN', 'Calibrator Manufacturer', ...
        'Calibrator Model', 'Passed Calibration', 'Calibration Date', ...
        'Calibration Time', 'Microphone Unique ID SN', ...
        'Microphone Manufacturer', 'Microphone Model', 'Microphone Diameter', ...
        'Service ID', 'Weapon Category ID', 'Weapon Category Description', ...
        'Weapon Type ID', 'Weapon Type Description', 'Weapon System ID', ...
        'Weapon System Description', 'Ammunition ID', 'Ammunition Description', ...
        'Field ID', 'Body Location ID', 'Body Location Description', ...
        'Use ID', 'Use Description', 'Sync Date', 'Sync Time', 'Posture ID', ...
        'Posture Description', 'Proximity To Source', 'Proximity UOM ID', ...
        'Orientation ID', 'Orientation Description', 'Role ID', ...
        'Role Description', 'Position To Others', 'Peak Sound Pressure Level', ...
        'Peak Sound Pressure Level UOM ID', 'A Duration', 'B Duration', ...
        'Number Of Events', 'Leq 100ms', 'Leq 8hr', 'Unwarned ARU', ...
        'Sampling Rate', 'Anti-Aliasing Filter', 'Analysis Description', ...
        'RPUID', 'Air Temperature', 'Temperature UOM ID', 'Humidity', ...
        'Wind Speed', 'Wind Speed UOM ID', 'Barometric Pressure', ...
        'Barometric Pressure UOM ID', 'Environmental Obstacle ID', ...
        'Obstacle Description', 'Elevation', 'Elevation UOM ID', ...
        'Ambient Conditions General Comments' ...
    };
end
