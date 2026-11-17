function process_all_sessions(rootDir)
%PROCESS_ALL_SESSIONS  Recursively find *_Summary.csv files and process them.

    if nargin < 1
        rootDir = pwd;
    end

    outputDir = fullfile('data_for_export_to_doehrs');
    if ~exist(outputDir, 'dir')
        mkdir(outputDir);
    end

    files = dir(fullfile(rootDir, '**', '*_Summary.csv'));

    fprintf('Found %d session file(s).\n', numel(files));

    for i = 1:numel(files)
        sessionFile = fullfile(files(i).folder, files(i).name);
        fprintf('Processing (%d/%d): %s\n', i, numel(files), sessionFile);
        try
            generate_impulse_noise_csv(sessionFile, outputDir);
        catch ME
            fprintf(2, 'Failed on %s: %s\n', sessionFile, ME.message);
        end
    end
end