{
  description = "Re:Lunatic Player";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
  }: let
    eachSystem = f: builtins.mapAttrs f nixpkgs.legacyPackages;
  in {
    formatter = eachSystem (system: pkgs: pkgs.alejandra);

    devShells = eachSystem (
      system: pkgs: {
        default = pkgs.mkShellNoCC {
          packages = with pkgs; [
            nodejs
            pnpm
          ];

          env = {
            ELECTRON_SKIP_BINARY_DOWNLOAD = 1;
            ELECTRON_OVERRIDE_DIST_PATH = pkgs.electron.dist;
          };
        };
      }
    );

    packages = eachSystem (system: pkgs: {
      default = pkgs.callPackage ./default.nix {};
    });
  };
}
