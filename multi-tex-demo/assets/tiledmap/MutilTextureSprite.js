import { MutilTextureAssembler } from "./MutilTextureAssembler";
	
cc.Class({
    extends: cc.Sprite,

    setTextureIdx (idx) {
        this.textureIdx = idx
        this.setVertsDirty();
    },

    // 使用cc.Sprite默认逻辑
    _resetAssembler() {
        this.setVertsDirty();
        let assembler = this._assembler = new MutilTextureAssembler();

        this.setVertsDirty();

        assembler.init(this); 
        
        this._updateColor();
    },

    // update (dt) {},
});
 