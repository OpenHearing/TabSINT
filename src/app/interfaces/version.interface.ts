export interface VersionInterface {
    tabsint: string;
    date: string;
    rev: string;
    version_code: string;
    deps: {
        user_agent: string;
        node: string;
        capacitor: string;
    };
    plugins: string[];
}
