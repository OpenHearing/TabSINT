%DEMO_IMPULSE_NOISE_CSV  Run the converter on a session and report.
%
%   Run from MATLAB:  demo_impulse_noise_csv
%
%   Point SESSIONFILE at the example Summary CSV. Output is written next to it in outputDir.

sessionFile = '0010_20260730T121022.000Z_multi/0010_20260730T121022.000Z_multi/0010_20260730T121022.000Z_multi_Summary.csv';
outputDir   = fullfile('data_for_export_to_doehrs');

generate_impulse_noise_csv(sessionFile, outputDir);

disp(['Demo CSV written under: ' outputDir]);

% OR
% process_all_sessions(<dir>);
