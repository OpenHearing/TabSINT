// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Tabsintcha",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "Tabsintcha",
            targets: ["TabsintChaPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "TabsintChaPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/TabsintChaPlugin"),
        .testTarget(
            name: "TabsintChaPluginTests",
            dependencies: ["TabsintChaPlugin"],
            path: "ios/Tests/TabsintChaPluginTests")
    ]
)