// Single-image HEIF container. One HEVC Main 8-bit 4:2:0 item, no tracks or metadata.
fn boxed(kind: &[u8; 4], parts: &[&[u8]]) -> Vec<u8> {
    let size = 8 + parts.iter().map(|part| part.len()).sum::<usize>();
    let mut result = Vec::with_capacity(size);
    result.extend_from_slice(&(size as u32).to_be_bytes());
    result.extend_from_slice(kind);
    for part in parts { result.extend_from_slice(part); }
    result
}

fn full(kind: &[u8; 4], version: u8, parts: &[&[u8]]) -> Vec<u8> {
    let mut payload = vec![version, 0, 0, 0];
    for part in parts { payload.extend_from_slice(part); }
    boxed(kind, &[&payload])
}

pub fn package(hvcc: &[u8], data: &[u8], w: u32, h: u32, cw: u32, ch: u32) -> Vec<u8> {
    let ftyp = boxed(b"ftyp", &[b"heic", &0u32.to_be_bytes(), b"mif1heic"]);
    let meta = |offset: u32| full(b"meta", 0, &[
        &full(b"hdlr", 0, &[&[0; 4], b"pict", &[0; 12], &[0]]),
        &full(b"pitm", 0, &[&1u16.to_be_bytes()]),
        &full(b"iloc", 0, &[
            &[0x44, 0], &1u16.to_be_bytes(), &1u16.to_be_bytes(), &0u16.to_be_bytes(),
            &1u16.to_be_bytes(), &offset.to_be_bytes(), &(data.len() as u32).to_be_bytes(),
        ]),
        &full(b"iinf", 0, &[&1u16.to_be_bytes(), &full(b"infe", 2, &[
            &1u16.to_be_bytes(), &0u16.to_be_bytes(), b"hvc1", &[0],
        ])]),
        &boxed(b"iprp", &[
            &boxed(b"ipco", &[
                hvcc,
                &full(b"ispe", 0, &[&cw.to_be_bytes(), &ch.to_be_bytes()]),
                &full(b"pixi", 0, &[&[3, 8, 8, 8]]),
                // sRGB primaries/transfer, BT.601 matrix, limited range (matching colorconv).
                &boxed(b"colr", &[b"nclx", &1u16.to_be_bytes(), &13u16.to_be_bytes(), &6u16.to_be_bytes(), &[0]]),
                &boxed(b"clap", &[
                    &w.to_be_bytes(), &1u32.to_be_bytes(), &h.to_be_bytes(), &1u32.to_be_bytes(),
                    &(w as i32 - cw as i32).to_be_bytes(), &2u32.to_be_bytes(),
                    &(h as i32 - ch as i32).to_be_bytes(), &2u32.to_be_bytes(),
                ]),
            ]),
            &full(b"ipma", 0, &[&1u32.to_be_bytes(), &1u16.to_be_bytes(), &[5, 0x81, 0x82, 3, 4, 0x85]]),
        ]),
    ]);
    let header = meta((ftyp.len() + meta(0).len() + 8) as u32);
    [ftyp, header, boxed(b"mdat", &[data])].concat()
}
