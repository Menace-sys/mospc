# Qismbozor

Byudjet bo'yicha PC yig'ish sayti. Oddiy statik sayt: `index.html` + `assets/` + `data/catalog.js`.

## Narxlarni yangilash
Do'konning narx ro'yxati (Excel) bilan:

    cd tools
    python3 build_catalog.py /yo'l/narxlar.xlsx
    python3 finalize.py

Natija `data/catalog.js` ga yoziladi. Keyin commit va push qiling, sayt o'zi yangilanadi.
Ulgurji ro'yxatning o'zini repoga qo'shmang.
