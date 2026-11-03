module.exports = {
 packagerConfig: {asar:true, ignore:[/^\/src($|\/)/,/^\/tests($|\/)/,/^\/node_modules($|\/)/,/^\/out($|\/)/,/^\/\.git($|\/)/]},
 makers:[{name:'@electron-forge/maker-zip',platforms:['win32','linux']},{name:'@electron-forge/maker-squirrel',config:{name:'echo_drive'}}]
};
