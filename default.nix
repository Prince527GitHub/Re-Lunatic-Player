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

  nativeBuildInputs =
    [
      makeWrapper
      pnpmConfigHook
      nodejs
      pnpm
      electron
      zip
    ]
    ++ lib.optionals stdenvNoCC.hostPlatform.isLinux [
      autoPatchelfHook
    ];

  buildInputs = lib.optionals stdenvNoCC.hostPlatform.isLinux [
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
    name = finalAttrs.pname;
    desktopName = "Re:Lunatic Player";
    exec = finalAttrs.pname;
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

  installPhase =
    lib.optionalString stdenvNoCC.hostPlatform.isLinux ''
      mkdir -p $out/share
      cp -r out/*/resources{,.pak} "$out/share"

      makeWrapper ${lib.getExe electron} $out/bin/re-lunatic-player \
        --add-flags $out/share/resources/app.asar \
        --set ELECTRON_FORCE_IS_PACKAGED 1 \
        --inherit-argv0
    ''
    + lib.optionalString stdenvNoCC.hostPlatform.isDarwin ''
      mkdir -p $out/Applications
      cp -r out/*/Re-Lunatic\ Player.app $out/Applications

      makeWrapper "$out/Applicaations/Re-Lunatic Player.app/Contents/Macos/re-lunatic-player" "$out/bin/re-lunatic-player" \
        --set ELECTRON_FORCE_IS_PACKAGED 1 \
        --inherit argv0
    '';

  meta = {
    description = "Music player for Gensokyo Radio";
    homepage = "https://github.com/Prince527Github/Re-Lunatic-Player";
    license = lib.licenses.agpl3Plus;
    maintainers = [
      "Prince527"
      "The25thWam"
    ];
    platforms = with lib.platforms; linux ++ darwin;
    mainProgram = finalAttrs.pname;
  };
})
