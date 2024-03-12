export enum AppState {
    Welcome,
    Admin,
    Exam,
    null
}

export enum ProtocolState {
    null,
    Ready,
    InProgress
}

export enum Server {
    Gitlab,
    Local
}

export enum ResultsMode {
    UploadOnly = "Upload Only",
    ExportOnly = "Export Only",
    UploadAndExport = "Upload and Export"
}

export enum ProtocolServer {
    LocalServer,
    Gitlab,
    Developer
}

export const ValidateProtocolTooltip = $localize`Validate protocols against the <b>Protocol Schema</b> before loading into the application. <br /><br /> The protocol schema defines the allowable inputs for use in protocols.`