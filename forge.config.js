const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const path = require("path");

const icon = path.join(__dirname, "src/img/logo");

module.exports = {
  packagerConfig: {
    executableName: "re-lunatic-player",
    productName: "Re:Lunatic Player",
    name: "Re:Lunatic Player",
    icon: icon,
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        iconUrl: "https://api.serversmp.xyz/upload/683b06cebf4051700ba56804.ico",
        setupIcon: `${icon}.ico`,
        name: "ReLunaticPlayer"
      },
    },
    {
      name: "@electron-forge/maker-wix",
      config: {
        icon: `${icon}.ico`
      },
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
        icon: `${icon}.png`
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        icon: `${icon}.png`
      },
    },
    {
      name: "@electron-forge/maker-flatpak",
      config: {
        options: {
          categories: ["Audio"],
          icon: `${icon}.png`
        }
      }
    },
    {
      name: "@forkprince/electron-forge-maker-appimage",
      platforms: ["linux"],
      config: {
        productName: "Re:Lunatic Player",
        icons: [
          {
            file: `${icon}.png`,
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