export interface VersionInterface {
    tabsint: string;
    date: string;
    rev: string;
    version_code: string;
    deps: {
        user_agent: string;
        node: string;
        cordova: string;
    };
    plugins: string[];
}
