const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const { FusesPlugin } = require("@electron-forge/plugin-fuses");

module.exports = {
  packagerConfig: {
    name: "Re:Lunatic Player",
    icon: "./src/img/logo",
    executableName: "Re-Lunatic Player",
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {},
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "Re:Lunatic Player"
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          productName: "Re:Lunatic Player",
          icon: "./src/img/logo.png"
        }
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          productName: "Re:Lunatic Player",
          icon: "./src/img/logo.png"
        }
      },
    },
    {
      name: "@prince527/electron-forge-maker-appimage",
      platforms: ["linux"],
      config: {
        productName: "Re:Lunatic Player",
        icons: [
          {
            file: "./src/img/logo.png",
            size: 256
          }
        ]
      },
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "Prince527GitHub",
          name: "Re-Lunatic-Player"
        },
        prerelease: false,
        draft: true
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
