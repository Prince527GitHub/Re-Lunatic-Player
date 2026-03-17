{
  description = "Re:Lunatic Player";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    systems.url = "github:nix-systems/default";
  };

  outputs = {
    systems,
    nixpkgs,
    ...
  }: let
    eachSystem = nixpkgs.lib.genAttrs (import systems);
  in {
    devShells = eachSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        electron = pkgs.electron_41-bin;
      in {
        default = pkgs.mkShell {
          packages = with pkgs; [
            electron
            nodejs
            pnpm
          ];

          shellHook = ''
            export ELECTRON_OVERRIDE_DIST_PATH="${electron}/bin/"
            export ELECTRON_SKIP_BINARY_DOWNLOAD=1
          '';
        };
      }
    );
  };
}
