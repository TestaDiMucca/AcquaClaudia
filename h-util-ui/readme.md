# Acqua Claudia (H-Util UI)

A UI version of H-util to support dragging and dropping files and pipeline building.

## Setup

Run `npm run setup`

(As a side note, project was bootstrapped with `yarn` but migrated into an npm workspace, which caused some funky incompatibilities)

Because npm workspace support isn't baked into electron builder, and npm link does not bring in all the dependencies, we're using a lousy workaround by importing the packages source and adding the packages dependencies as dependencies here as well. Will need to run the sync script.

```bash
npm run packages:sync
```

Because of this, do not make modifications to the shared packages here. Instead, go to `~/packages/*` and edit the source files included there, and run the sync which will bring the files over.

## Development mode

You can start development mode by running. For more scripts you can review the script property in the package.json
```bash
npm run start
```
Run `npm run app:build` for production or you can run `npm run app:build:nightly` for nightly version.

when running `build commands` make sure to add github repository property on your package.json, and add your repository link as the value.

## Notes

- Bootstrapped with [this template](https://github.com/BroJenuel/vue-3-vite-electron-typescript)
- Using Quasar for components/UI
- Vue Material Icons reference can be found [here](https://pictogrammers.com/library/mdi/)
- For VSC, Jest plugin is recommended