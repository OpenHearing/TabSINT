// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Tabsintfs",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "Tabsintfs",
            targets: ["TabsintFsPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "TabsintFsPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/TabsintFsPlugin"),
        .testTarget(
            name: "TabsintFsPluginTests",
            dependencies: ["TabsintFsPlugin"],
            path: "ios/Tests/TabsintFsPluginTests")
    ]
)