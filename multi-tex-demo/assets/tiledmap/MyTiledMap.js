// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.TiledMap,

    properties: {
    },

    _buildLayerAndGroup: function () {
        let tilesets = this._tilesets;
        let texGrids = this._texGrids;
        let animations = this._animations;
        texGrids.length = 0;
        for (let i = 0, l = tilesets.length; i < l; ++i) {
            let tilesetInfo = tilesets[i];
            if (!tilesetInfo) continue;
            cc.TiledMap.fillTextureGrids(tilesetInfo, texGrids, i);
        }
        this._fillAniGrids(texGrids, animations);

        let layers = this._layers;
        let groups = this._groups;
        let images = this._images;
        let oldNodeNames = {};
        for (let i = 0, n = layers.length; i < n; i++) {
            oldNodeNames[layers[i].node._name] = true;
        }
        for (let i = 0, n = groups.length; i < n; i++) {
            oldNodeNames[groups[i].node._name] = true;
        }
        for (let i = 0, n = images.length; i < n; i++) {
            oldNodeNames[images[i]._name] = true;
        }

        layers = this._layers = [];
        groups = this._groups = [];
        images = this._images = [];

        let mapInfo = this._mapInfo;
        let node = this.node;
        let layerInfos = mapInfo.getAllChildren();
        let textures = this._textures;
        let maxWidth = 0;
        let maxHeight = 0;

        if (layerInfos && layerInfos.length > 0) {
            for (let i = 0, len = layerInfos.length; i < len; i++) {
                let layerInfo = layerInfos[i];
                let name = layerInfo.name;

                let child = this.node.getChildByName(name);
                oldNodeNames[name] = false;

                if (!child) {
                    child = new cc.Node();
                    child.name = name;
                    node.addChild(child);
                }

                child.setSiblingIndex(i);
                child.active = layerInfo.visible;

                if (layerInfo instanceof cc.TMXLayerInfo) {
                    let layer = child.getComponent(cc.TiledLayer);
                    if (!layer) {
                        layer = child.addComponent(cc.TiledLayer);
                    }
                    
                    layer._init(layerInfo, mapInfo, tilesets, textures, texGrids);

                    // tell the layerinfo to release the ownership of the tiles map.
                    layerInfo.ownTiles = false;
                    layers.push(layer);
                }
                else if (layerInfo instanceof cc.TMXObjectGroupInfo) {
                    let group = child.getComponent("MyObjectGroup");
                    if (!group) {
                        group = child.addComponent("MyObjectGroup");
                    }
                    group._init(layerInfo, mapInfo, texGrids);
                    groups.push(group);
                }
                else if (layerInfo instanceof cc.TMXImageLayerInfo) {
                    let texture = layerInfo.sourceImage;
                    child.opacity = layerInfo.opacity;
                    child.layerInfo = layerInfo;
                    child._offset = cc.v2(layerInfo.offset.x, -layerInfo.offset.y);

                    let image = child.getComponent(cc.Sprite);
                    if (!image) {
                        image = child.addComponent(cc.Sprite);
                    }
                    
                    let spf = image.spriteFrame || new cc.SpriteFrame();
                    spf.setTexture(texture);
                    image.spriteFrame = spf;

                    child.width = texture.width;
                    child.height = texture.height;
                    images.push(child);
                }

                maxWidth = Math.max(maxWidth, child.width);
                maxHeight = Math.max(maxHeight, child.height);
            }
        }

        let children = node.children;
        for (let i = 0, n = children.length; i < n; i++) {
            let c = children[i];
            if (oldNodeNames[c._name]) {
                c.destroy();
            }
        }

        this.node.width = maxWidth;
        this.node.height = maxHeight;
        this._syncAnchorPoint();
    }
});
