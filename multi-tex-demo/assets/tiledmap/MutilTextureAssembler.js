let gfx = cc.gfx;
var vfmtPosUvColorIndex = new gfx.VertexFormat([
    { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
    { name: gfx.ATTR_UV0, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
    { name: "a_texture_idx", type: gfx.ATTR_TYPE_FLOAT32, num: 1 },
    { name: gfx.ATTR_COLOR, type: gfx.ATTR_TYPE_UINT8, num: 4, normalize: true },
]);

export class MutilTextureAssembler extends cc.Assembler {
    init(comp) {
        super.init(comp);

        this.floatsPerVert = 6;
        this.uvOffset = 2;
        this.colorOffset = 5;
        
        this.verticesCount = 4;
        this.indicesCount = 6;

        // cc.Assembler2D的初始化放在constructor里
        // 此处把初始化放在init里，以便成员变量能够有机会修改
        this._renderData = new cc.RenderData();
        this._renderData.init(this);

        this.initLocal();
        this.initData();
    }

    initLocal() {
        this._local = [];
        this._local.length = 4;
    }

    initData() {
        let data = this._renderData;
        // createFlexData支持创建指定格式的renderData
        data.createFlexData(0, this.verticesCount, this.indicesCount, this.getVfmt());

        // createFlexData不会填充顶点索引信息，手动补充一下
        let indices = data.iDatas[0];
        let count = indices.length / 6;
        for (let i = 0, idx = 0; i < count; i++) {
            let vertextID = i * 4;
            indices[idx++] = vertextID;
            indices[idx++] = vertextID+1;
            indices[idx++] = vertextID+2;
            indices[idx++] = vertextID+1;
            indices[idx++] = vertextID+3;
            indices[idx++] = vertextID+2;
        }
    }
    
    getBuffer() {
        return cc.renderer._handle.getBuffer("mesh", this.getVfmt());
    }

    getVfmt () {
        return vfmtPosUvColorIndex;
    }

    updateRenderData (sprite) {
        this.packToDynamicAtlas(sprite, sprite._spriteFrame);

        if (sprite._vertsDirty) {
            this.updateUVs(sprite);
            this.updateVerts(sprite);
            this.updateTextureIdx(sprite);
            sprite._vertsDirty = false;
        }
    }

    updateUVs (sprite) {
        let uv = sprite._spriteFrame.uv;
        let uvOffset = this.uvOffset;
        let floatsPerVert = this.floatsPerVert;
        let verts = this._renderData.vDatas[0];
        for (let i = 0; i < 4; i++) {
            let srcOffset = i * 2;
            let dstOffset = floatsPerVert * i + uvOffset;
            verts[dstOffset] = uv[srcOffset];
            verts[dstOffset + 1] = uv[srcOffset + 1];
        }
    }

    updateVerts (sprite) {
        let node = sprite.node,
            cw = node.width, ch = node.height,
            appx = node.anchorX * cw, appy = node.anchorY * ch,
            l, b, r, t;
        if (sprite.trim) {
            l = -appx;
            b = -appy;
            r = cw - appx;
            t = ch - appy;
        }
        else {
            let frame = sprite.spriteFrame,
                ow = frame._originalSize.width, oh = frame._originalSize.height,
                rw = frame._rect.width, rh = frame._rect.height,
                offset = frame._offset,
                scaleX = cw / ow, scaleY = ch / oh;
            let trimLeft = offset.x + (ow - rw) / 2;
            let trimRight = offset.x - (ow - rw) / 2;
            let trimBottom = offset.y + (oh - rh) / 2;
            let trimTop = offset.y - (oh - rh) / 2;
            l = trimLeft * scaleX - appx;
            b = trimBottom * scaleY - appy;
            r = cw + trimRight * scaleX - appx;
            t = ch + trimTop * scaleY - appy;
        }

        let local = this._local;
        local[0] = l;
        local[1] = b;
        local[2] = r;
        local[3] = t;
        this.updateWorldVerts(sprite);
    }

    
    updateTextureIdx(sprite) {
        let verts = this._renderData.vDatas[0];

        verts[4] = sprite.textureIdx;
        verts[10] = sprite.textureIdx;
        verts[16] = sprite.textureIdx;
        verts[22] = sprite.textureIdx;
    }

    get verticesFloats () {
        return this.verticesCount * this.floatsPerVert;
    }

    updateColor (comp, color) {
        let uintVerts = this._renderData.uintVDatas[0];
        if (!uintVerts) return;
        color = color != null ? color : comp.node.color._val;
        let floatsPerVert = this.floatsPerVert;
        let colorOffset = this.colorOffset;
        for (let i = colorOffset, l = uintVerts.length; i < l; i += floatsPerVert) {
            uintVerts[i] = color;
        }
    }

    updateWorldVerts (comp) {
        if (CC_NATIVERENDERER) {
            var local = this._local;
            var verts = this._renderData.vDatas[0];
            var vl = local[0],
                vr = local[2],
                vb = local[1],
                vt = local[3];
            var floatsPerVert = this.floatsPerVert;
            var vertexOffset = 0; // left bottom
          
            verts[vertexOffset] = vl;
            verts[vertexOffset + 1] = vb;
            vertexOffset += floatsPerVert; // right bottom
          
            verts[vertexOffset] = vr;
            verts[vertexOffset + 1] = vb;
            vertexOffset += floatsPerVert; // left top
          
            verts[vertexOffset] = vl;
            verts[vertexOffset + 1] = vt;
            vertexOffset += floatsPerVert; // right top
          
            verts[vertexOffset] = vr;
            verts[vertexOffset + 1] = vt;
        } else {
            let local = this._local;
            let verts = this._renderData.vDatas[0];
    
            let matrix = comp.node._worldMatrix;
            let matrixm = matrix.m,
                a = matrixm[0], b = matrixm[1], c = matrixm[4], d = matrixm[5],
                tx = matrixm[12], ty = matrixm[13];
    
            let vl = local[0], vr = local[2],
                vb = local[1], vt = local[3];
            
            let floatsPerVert = this.floatsPerVert;
            let vertexOffset = 0;
            let justTranslate = a === 1 && b === 0 && c === 0 && d === 1;
    
            if (justTranslate) {
                // left bottom
                verts[vertexOffset] = vl + tx;
                verts[vertexOffset + 1] = vb + ty;
                vertexOffset += floatsPerVert;
                // right bottom
                verts[vertexOffset] = vr + tx;
                verts[vertexOffset + 1] = vb + ty;
                vertexOffset += floatsPerVert;
                // left top
                verts[vertexOffset] = vl + tx;
                verts[vertexOffset + 1] = vt + ty;
                vertexOffset += floatsPerVert;
                // right top
                verts[vertexOffset] = vr + tx;
                verts[vertexOffset + 1] = vt + ty;
            } else {
                let al = a * vl, ar = a * vr,
                bl = b * vl, br = b * vr,
                cb = c * vb, ct = c * vt,
                db = d * vb, dt = d * vt;
    
                // left bottom
                verts[vertexOffset] = al + cb + tx;
                verts[vertexOffset + 1] = bl + db + ty;
                vertexOffset += floatsPerVert;
                // right bottom
                verts[vertexOffset] = ar + cb + tx;
                verts[vertexOffset + 1] = br + db + ty;
                vertexOffset += floatsPerVert;
                // left top
                verts[vertexOffset] = al + ct + tx;
                verts[vertexOffset + 1] = bl + dt + ty;
                vertexOffset += floatsPerVert;
                // right top
                verts[vertexOffset] = ar + ct + tx;
                verts[vertexOffset + 1] = br + dt + ty;
            }
        }
    }

    fillBuffers (comp, renderer) {
        if (renderer.worldMatDirty) {
            this.updateWorldVerts(comp);
        }

        let renderData = this._renderData;
        let vData = renderData.vDatas[0];
        let iData = renderData.iDatas[0];

        let buffer = this.getBuffer(renderer);
        let offsetInfo = buffer.request(this.verticesCount, this.indicesCount);

        // buffer data may be realloc, need get reference after request.

        // fill vertices
        let vertexOffset = offsetInfo.byteOffset >> 2,
            vbuf = buffer._vData;

        if (vData.length + vertexOffset > vbuf.length) {
            vbuf.set(vData.subarray(0, vbuf.length - vertexOffset), vertexOffset);
        } else {
            vbuf.set(vData, vertexOffset);
        }

        // fill indices
        let ibuf = buffer._iData,
            indiceOffset = offsetInfo.indiceOffset,
            vertexId = offsetInfo.vertexOffset;
        for (let i = 0, l = iData.length; i < l; i++) {
            ibuf[indiceOffset++] = vertexId + iData[i];
        }
    }

    packToDynamicAtlas (comp, frame) {
        if (CC_TEST) return;
        
        if (!frame._original && cc.dynamicAtlasManager && frame._texture.packable) {
            let packedFrame = cc.dynamicAtlasManager.insertSpriteFrame(frame);
            if (packedFrame) {
                frame._setDynamicAtlasFrame(packedFrame);
            }
        }
        let material = comp._materials[0];
        if (!material) return;
        
        if (material.getProperty('texture') !== frame._texture) {
            // texture was packed to dynamic atlas, should update uvs
            comp._vertsDirty = true;
            comp._updateMaterial();
        }
    }
}