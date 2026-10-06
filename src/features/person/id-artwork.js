(() => {
  'use strict';
  function waves() {
    let paths = '';
    for (let row = 0; row < 55; row++) {
      const y = 115 + row * 7;
      let d = '';
      for (let x = -20; x <= 880; x += 8) {
        const offset = Math.sin(x / 135 + row * .016) * 35 + Math.sin(x / 320) * 21;
        d += `${x === -20 ? 'M' : 'L'}${x} ${(y + offset).toFixed(2)} `;
      }
      paths += `<path d="${d}" fill="none" stroke="${row < 30 ? '#b7aa64' : '#6e9f7d'}" stroke-width=".9" opacity=".35"/>`;
    }
    return paths;
  }
  function rosette() {
    let paths = '';
    for (let layer = 0; layer < 22; layer++) {
      let d = '';
      for (let step = 0; step <= 240; step++) {
        const theta = step * Math.PI / 120;
        const radius = 68 + layer * 4.8 + Math.sin(theta * 18) * (5 + layer * .16);
        const x = 439 + Math.cos(theta) * radius, y = 282 + Math.sin(theta) * radius;
        d += `${step === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      paths += `<path d="${d}Z" fill="none" stroke="#6c9e82" stroke-width=".65"/>`;
    }
    return paths;
  }
  function barcode(number) {
    // Deterministic visual stripes for this training card; the app does not scan them.
    const patterns = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
    const bits = '101' + [...number].map((digit, index) => index % 2 ? patterns[Number(digit)].replace(/[01]/g, bit => bit === '1' ? '0' : '1') : patterns[Number(digit)]).join('') + '101';
    const unit = 240 / bits.length;
    return [...bits].map((bit, index) => bit === '1' ? `<rect x="${(39 + index * unit).toFixed(3)}" y="465" width="${unit.toFixed(3)}" height="31"/>` : '').join('');
  }
  globalThis.IDCardArtwork = Object.freeze({waves, rosette, barcode});

})();
