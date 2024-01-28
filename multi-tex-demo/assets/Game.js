// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        material: cc.Material,

        labelDc: cc.Label,

        tileMap: cc.TiledMap,
        tileData: cc.TiledMapAsset,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        window.main = this;

        this._sprites = [];

        cc.assetManager.preloadAny({uuid:"b3O6UU0RhBwbCTJA60Njd0"});

        this.tileMap.tmxAsset =  this.tileData;
    },

    update (dt) {
        this.labelDc.string = `DC:${cc.renderer.device.getDrawCalls()}`;
    },
});
