const si = new Uint32Array([1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298]);
function Oi(sn, Wt, we, Qe, pn) {
    let Mn, hn, Bn, li, jt, Qn, Re, ln, Cn, ii, Gi, no, Ar;
    for (; pn >= 64; ) {
        for (Mn = Wt[0],
                 hn = Wt[1],
                 Bn = Wt[2],
                 li = Wt[3],
                 jt = Wt[4],
                 Qn = Wt[5],
                 Re = Wt[6],
                 ln = Wt[7],
                 ii = 0; ii < 16; ii++)
            Gi = Qe + 4 * ii,
                sn[ii] = (255 & we[Gi]) << 24 | (255 & we[Gi + 1]) << 16 | (255 & we[Gi + 2]) << 8 | 255 & we[Gi + 3];
        for (ii = 16; ii < 64; ii++)
            Cn = sn[ii - 2],
                no = (Cn >>> 17 | Cn << 15) ^ (Cn >>> 19 | Cn << 13) ^ Cn >>> 10,
                Cn = sn[ii - 15],
                Ar = (Cn >>> 7 | Cn << 25) ^ (Cn >>> 18 | Cn << 14) ^ Cn >>> 3,
                sn[ii] = (no + sn[ii - 7] | 0) + (Ar + sn[ii - 16] | 0);
        for (ii = 0; ii < 64; ii++)
            no = (((jt >>> 6 | jt << 26) ^ (jt >>> 11 | jt << 21) ^ (jt >>> 25 | jt << 7)) + (jt & Qn ^ ~jt & Re) | 0) + (ln + (si[ii] + sn[ii] | 0) | 0) | 0,
                Ar = ((Mn >>> 2 | Mn << 30) ^ (Mn >>> 13 | Mn << 19) ^ (Mn >>> 22 | Mn << 10)) + (Mn & hn ^ Mn & Bn ^ hn & Bn) | 0,
                ln = Re,
                Re = Qn,
                Qn = jt,
                jt = li + no | 0,
                li = Bn,
                Bn = hn,
                hn = Mn,
                Mn = no + Ar | 0;
        Wt[0] += Mn,
            Wt[1] += hn,
            Wt[2] += Bn,
            Wt[3] += li,
            Wt[4] += jt,
            Wt[5] += Qn,
            Wt[6] += Re,
            Wt[7] += ln,
            Qe += 64,
            pn -= 64
    }
    return Qe
}

class bi {
    constructor() {
        this.digestLength = 32,
            this.blockSize = 64,
            this.state = new Int32Array(8),
            this.temp = new Int32Array(64),
            this.buffer = new Uint8Array(128),
            this.bufferLength = 0,
            this.bytesHashed = 0,
            this.finished = !1,
            this.reset()
    }
    reset() {
        return this.state[0] = 1779033703,
            this.state[1] = 3144134277,
            this.state[2] = 1013904242,
            this.state[3] = 2773480762,
            this.state[4] = 1359893119,
            this.state[5] = 2600822924,
            this.state[6] = 528734635,
            this.state[7] = 1541459225,
            this.bufferLength = 0,
            this.bytesHashed = 0,
            this.finished = !1,
            this
    }
    clean() {
        for (let Wt = 0; Wt < this.buffer.length; Wt++)
            this.buffer[Wt] = 0;
        for (let Wt = 0; Wt < this.temp.length; Wt++)
            this.temp[Wt] = 0;
        this.reset()
    }
    update(Wt, we=Wt.length) {
        if (this.finished)
            throw new Error("SHA256: can't update because hash was finished.");
        let Qe = 0;
        if (this.bytesHashed += we,
        this.bufferLength > 0) {
            for (; this.bufferLength < 64 && we > 0; )
                this.buffer[this.bufferLength++] = Wt[Qe++],
                    we--;
            64 === this.bufferLength && (Oi(this.temp, this.state, this.buffer, 0, 64),
                this.bufferLength = 0)
        }
        for (we >= 64 && (Qe = Oi(this.temp, this.state, Wt, Qe, we),
            we %= 64); we > 0; )
            this.buffer[this.bufferLength++] = Wt[Qe++],
                we--;
        return this
    }
    finish(Wt) {
        if (!this.finished) {
            const we = this.bytesHashed
                , Qe = this.bufferLength
                , pn = we / 536870912 | 0
                , Mn = we << 3
                , hn = we % 64 < 56 ? 64 : 128;
            this.buffer[Qe] = 128;
            for (let Bn = Qe + 1; Bn < hn - 8; Bn++)
                this.buffer[Bn] = 0;
            this.buffer[hn - 8] = pn >>> 24 & 255,
                this.buffer[hn - 7] = pn >>> 16 & 255,
                this.buffer[hn - 6] = pn >>> 8 & 255,
                this.buffer[hn - 5] = pn >>> 0 & 255,
                this.buffer[hn - 4] = Mn >>> 24 & 255,
                this.buffer[hn - 3] = Mn >>> 16 & 255,
                this.buffer[hn - 2] = Mn >>> 8 & 255,
                this.buffer[hn - 1] = Mn >>> 0 & 255,
                Oi(this.temp, this.state, this.buffer, 0, hn),
                this.finished = !0
        }
        for (let we = 0; we < 8; we++)
            Wt[4 * we + 0] = this.state[we] >>> 24 & 255,
                Wt[4 * we + 1] = this.state[we] >>> 16 & 255,
                Wt[4 * we + 2] = this.state[we] >>> 8 & 255,
                Wt[4 * we + 3] = this.state[we] >>> 0 & 255;
        return this
    }
    digest() {
        const Wt = new Uint8Array(this.digestLength);
        return this.finish(Wt),
            Wt
    }
    _saveState(Wt) {
        for (let we = 0; we < this.state.length; we++)
            Wt[we] = this.state[we]
    }
    _restoreState(Wt, we) {
        for (let Qe = 0; Qe < this.state.length; Qe++)
            this.state[Qe] = Wt[Qe];
        this.bytesHashed = we,
            this.finished = !1,
            this.bufferLength = 0
    }
}

class privateCrypto {
    calcHash(we, Qe) {
        return function tr(sn) {
            const Wt = [];
            for (let we = 0; we < sn.length; we++)
                Wt.push(String.fromCharCode(sn[we]));
            return Wt.join("")
        }(function $i(sn) {
            const Wt = (new bi).update(sn)
                , we = Wt.digest();
            return Wt.clean(),
                we
        }(function Wo(sn) {
            if ("string" != typeof sn)
                throw new TypeError("expected string");
            const Wt = sn
                , we = new Uint8Array(Wt.length);
            for (let Qe = 0; Qe < Wt.length; Qe++)
                we[Qe] = Wt.charCodeAt(Qe);
            return we
        }))
    }
    toHashString2(we) {
        let Qe = "";
        for (const pn of we)
            Qe += String.fromCharCode(pn);
        return Qe
    }
    toHashString(we) {
        const Qe = new Uint8Array(we);
        let pn = "";
        for (const Mn of Qe)
            pn += String.fromCharCode(Mn);
        return pn
    }
    /*static #e = this.\u0275fac = function(Qe) {
        return new (Qe || sn)
    }
    ;
    static #t = this.\u0275prov = A.\u0275\u0275defineInjectable({
        token: sn,
        factory: sn.\u0275fac
    })*/
}

function ho(sn) {
    return btoa(sn).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function createNonce() {
    const Qe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    let pn = 45 , Mn = "";
    const hn = typeof self > "u" ? null : self.crypto || self.msCrypto;
    if (hn) {
        let Bn = new Uint8Array(pn);
        hn.getRandomValues(Bn),
        Bn.map || (Bn.map = Array.prototype.map), Bn = Bn.map(li => Qe.charCodeAt(li % 66)), Mn = String.fromCharCode.apply(null, Bn)
    } else for (; 0 < pn--; ) Mn += Qe[66 * Math.random() | 0];
    return ho(Mn)
}

function createCodeChallange() {
    const Qe = createNonce();
    return ho(new privateCrypto().calcHash(Qe, "sha-256"));
}

function createLoginUrl() {
    let nonce = createNonce();
    let url = "https://login.sma.energy/auth/realms/SMA/protocol/openid-connect/auth?response_type=code&client_id=SPpbeOS&state=";
    url += encodeURIComponent(nonce);
    url += "&redirect_uri=https%3A%2F%2Fennexos.sunnyportal.com%2Fdashboard%2Finitialize&scope=openid%20profile&code_challenge=";
    url += createCodeChallange();
    url += "&code_challenge_method=S256&nonce=" + nonce;
}