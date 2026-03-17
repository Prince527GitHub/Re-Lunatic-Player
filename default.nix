{
  electron,
  nodejs,
  pnpm,
  zip,
  stdenvNoCC,
  autoPatchelfHook,
  makeDesktopItem,
  makeWrapper,
  pnpmConfigHook,
  fetchPnpmDeps,
  alsa-lib,
  gtk3,
  mesa,
  nss,
  libx11,
  libpulseaudio,
  libxslt,
  lib,
}:
stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "re-lunatic-player";
  version = "nightly";
  src = ./.;

  nativeBuildInputs = [
    autoPatchelfHook
    makeWrapper
    pnpmConfigHook
    nodejs
    pnpm
    electron
    zip
  ];

  buildInputs = [
    alsa-lib
    gtk3
    mesa
    nss

    libpulseaudio
    libxslt

    libx11
  ];

  env = {
    ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
  };

  desktopItems = makeDesktopItem {
    name = "re-lunatic-player";
    desktopName = "Re:Lunatic Player";
    exec = "re-lunatic-player";
    startupWMClass = "Re:Lunatic Player";
    genericName = "Radio Player";
    keywords = [
      "radio"
      "touhou"
      "lunatic"
      "player"
      "music"
    ];
    categories = [
      "Audio"
      "AudioVideo"
    ];
  };

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    fetcherVersion = 3;
    hash = "sha256-BHcHLDE4KBVWrG1Jevg9OPq/xdaN1PdtIfoqzDKDGYY=";
  };

  buildPhase = ''
    export npm_config_nodedir=${electron.headers}

    # override the detected electron version
    substituteInPlace node_modules/@electron-forge/core-utils/dist/electron-version.js \
      --replace-fail "return version" "return '${electron.version}'"

    # create the electron archive to be used by electron-packager
    cp -r ${electron.dist} electron-dist
    chmod -R u+w electron-dist

    pushd electron-dist
    zip -0Xqr ../electron.zip .
    popd

    rm -r electron-dist

    # force @electron/packager to use our electron instead of downloading it
    substituteInPlace node_modules/@electron/packager/dist/packager.js \
      --replace-fail "await this.getElectronZipPath(downloadOpts)" "'$(pwd)/electron.zip'"

    pnpm package
  '';

  installPhase = ''
    mkdir $out
    cp -r "./out/Re-Lunatic Player-linux-x64/" $out/opt

    makeWrapper ${lib.getExe electron} $out/bin/re-lunatic-player \
      --add-flags $out/opt/resources/app.asar
  '';
})
