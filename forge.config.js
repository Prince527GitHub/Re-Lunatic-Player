const { FuseV1Options, FuseVersion } = require("@electron/fuses");
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const path = require("path");
const os = require("os");

const icon = path.join(__dirname, "src/img/logo");

const makers = [
  {
    name: "@electron-forge/maker-squirrel",
    config: (arch) => ({
      iconUrl: "https://api.serversmp.xyz/upload/683b06cebf4051700ba56804.ico",
      setupIcon: `${icon}.ico`,
      name: arch === "arm64" ? "ReLunaticPlayer-arm64" : "ReLunaticPlayer",
      setupExe: arch === "arm64" ? "Re-Lunatic.Player-arm64-Setup.exe" : "Re-Lunatic.Player-Setup.exe"
    }),
  },
  {
    name: "@electron-forge/maker-zip"
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
    name: "@forkprince/electron-forge-maker-appimage",
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
  {
    name: "@forkprince/electron-forge-maker-targz",
  }
];

if (!(process.platform === "win32" && os.arch() === "arm64"))
  makers.splice(1, 0, {
    name: "@electron-forge/maker-wix",
    config: {
      exe: "re-lunatic-player.exe",
      shortName: "ReLunaticPlayer",
      manufacturer: "Prince527",
      icon: `${icon}.ico`
    },
  });

if (!(process.platform === "linux" && os.arch() === "arm64"))
  makers.splice(5, 0, {
    name: "@electron-forge/maker-flatpak",
    config: {
      options: {
        categories: ["Audio"],
        icon: `${icon}.png`
      }
    }
  });

module.exports = {
  packagerConfig: {
    executableName: "re-lunatic-player",
    productName: "Re:Lunatic Player",
    name: "Re:Lunatic Player",
    icon: icon,
    asar: true,
  },
  rebuildConfig: {},
  makers,
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