// Packaged and branded products, from the brand's own label (per serving or per 100 g).
// build-food.mjs adds each one as an ingredient (per 100 g, label calories kept as printed) AND as a
// ready-to-log item in the "Brands & packaged" list, so "1 scoop ON Gold Standard" is one tap.
//
// The same food differs a lot by brand: 200 g of Milky Mist High Protein paneer has 50 g protein,
// 200 g of Mother Dairy malai paneer has 31 g. Logging the brand you actually eat fixes that.
//
// b(id, name, aka, label, units, src)
//   label: { per: grams the numbers are for, kcal, p, c, f, fib? }
//   units: [[label, grams]] — the first one is the default serving
// Values are what the label says; labels change and flavours differ a little, so check your pack.

const brands = [];
const b = (id, name, aka, label, units, src) => {
  const k = 100 / label.per;
  const r = (x) => Math.round(x * k * 100) / 100;
  brands.push({
    id, name, aka, grp: 'brands', src,
    kcal: r(label.kcal), p: r(label.p), c: r(label.c), f: r(label.f), fib: r(label.fib ?? 0),
    units,
  });
};

/* ── Whey & gainers ── (1 scoop as the label defines it) */
b('on_gold_whey', 'Optimum Nutrition Gold Standard 100% Whey', 'ON whey protein scoop gold standard', { per: 30.4, kcal: 120, p: 24, c: 3, f: 1 }, [['1 scoop', 30.4], ['2 scoops', 60.8]], 'ON label: 1 scoop 30.4 g');
b('on_oats_whey', 'Optimum Nutrition 100% Oats & Whey', 'ON oats whey protein scoop', { per: 52, kcal: 200, p: 24, c: 22, f: 1.5 }, [['1 scoop', 52], ['2 scoops', 104]], 'ON label: 1 heaping scoop 52 g = 200 kcal');
b('on_hydrowhey', 'Optimum Nutrition Platinum Hydrowhey', 'ON whey isolate hydrolysed scoop', { per: 39, kcal: 140, p: 30, c: 2, f: 1 }, [['1 scoop', 39]], 'ON label: 1 scoop 39 g');
b('on_serious_mass', 'Optimum Nutrition Serious Mass (gainer)', 'ON mass gainer weight gainer', { per: 336, kcal: 1250, p: 50, c: 252, f: 4.5 }, [['1 scoop', 56], ['1 label serving', 336]], 'ON label: 1 serving 336 g');
b('mb_biozyme', 'MuscleBlaze Biozyme Performance Whey', 'MB whey protein scoop muscle blaze', { per: 36, kcal: 140, p: 25, c: 5.65, f: 1.8 }, [['1 scoop', 36]], 'MuscleBlaze label: 1 scoop 36 g');
b('mb_raw_whey', 'MuscleBlaze Raw Whey 80% (unflavoured)', 'MB raw whey concentrate muscle blaze', { per: 30, kcal: 118, p: 24, c: 2.1, f: 1.5 }, [['1 scoop', 30]], 'MuscleBlaze label: 1 scoop 30 g');
b('mb_raw_isolate', 'MuscleBlaze Raw Whey Isolate 90%', 'MB isolate muscle blaze', { per: 30, kcal: 112, p: 27, c: 0.45, f: 0.3 }, [['1 scoop', 30]], 'MuscleBlaze label: 1 scoop 30 g');
b('avvatar_whey', 'Avvatar 100% Whey Protein', 'avatar whey protein scoop', { per: 35, kcal: 141, p: 27.6, c: 3, f: 2.1 }, [['1 scoop', 35]], 'Avvatar label: 1 rounded scoop 35 g');
b('atom_whey', 'AS-IT-IS Atom Whey Protein', 'asitis atom whey scoop', { per: 35, kcal: 125, p: 27, c: 4.7, f: 1 }, [['1 scoop', 35]], 'AS-IT-IS label per serving (125 kcal, 27 g protein); scoop weight ≈35 g');
b('myprotein_impact', 'Myprotein Impact Whey', 'my protein whey scoop', { per: 30, kcal: 116, p: 22, c: 2.78, f: 1.8 }, [['1 scoop', 30]], 'Myprotein label: 1 scoop 30 g');
b('dymatize_iso100', 'Dymatize ISO100', 'whey isolate hydrolyzed scoop', { per: 31, kcal: 120, p: 25, c: 2, f: 0.5 }, [['1 scoop', 31]], 'Dymatize label: 1 scoop 31 g');
b('amul_whey', 'Amul Whey Protein', 'amul whey sachet', { per: 100, kcal: 383, p: 74, c: 10.6, f: 5 }, [['1 sachet', 34]], 'Amul label per 100 g; 1 sachet ≈34 g (25 g protein)');

/* ── Paneer ── */
b('mm_hp_paneer', 'Milky Mist High Protein Paneer', 'milkymist low fat paneer', { per: 100, kcal: 204, p: 25, c: 5.7, f: 9 }, [['1 serving', 100], ['1 pack', 200], ['1 cube', 10]], 'Milky Mist label per 100 g');
b('mm_paneer', 'Milky Mist Paneer', 'milkymist fresh paneer', { per: 100, kcal: 283, p: 16.1, c: 5.1, f: 22 }, [['1 serving', 100], ['1 pack', 200], ['1 cube', 10]], 'Milky Mist label per 100 g');
b('amul_paneer', 'Amul Malai Paneer', 'amul fresh paneer', { per: 100, kcal: 323, p: 20, c: 4.5, f: 25 }, [['1 serving', 100], ['1 pack', 200], ['1 cube', 10]], 'Amul label per 100 g');
b('md_paneer', 'Mother Dairy Malai Paneer', 'mother dairy fresh paneer', { per: 100, kcal: 324, p: 15.5, c: 2.5, f: 28 }, [['1 serving', 100], ['1 pack', 200], ['1 cube', 10]], 'Mother Dairy label per 100 g');
b('epigamia_paneer', 'Epigamia Protein Paneer', 'high protein paneer', { per: 100, kcal: 229, p: 25, c: 3, f: 13 }, [['1 serving', 100], ['1 pack', 200]], 'Epigamia label per 100 g');

/* ── Dahi, yogurt, protein dairy ── */
b('amul_masti_dahi', 'Amul Masti Dahi', 'amul curd yogurt', { per: 100, kcal: 65, p: 4, c: 4.6, f: 3.1 }, [['1 katori', 150], ['1 cup', 200], ['1 tub', 400]], 'Amul label per 100 g');
b('md_dahi', 'Mother Dairy Dahi', 'mother dairy curd yogurt', { per: 100, kcal: 62, p: 3.7, c: 5, f: 3 }, [['1 katori', 150], ['1 cup', 200], ['1 tub', 400]], 'Mother Dairy label per 100 g');
b('mm_curd', 'Milky Mist Probiotic Curd', 'milkymist dahi yogurt', { per: 100, kcal: 62, p: 3.5, c: 5.2, f: 3 }, [['1 katori', 150], ['1 cup', 200], ['1 tub', 400]], 'Milky Mist label per 100 g');
b('epigamia_greek', 'Epigamia Greek Yogurt, Natural', 'greek yoghurt', { per: 100, kcal: 65, p: 7, c: 5, f: 2 }, [['1 cup', 90], ['1 katori', 150]], 'Epigamia label per 100 g');
b('amul_protein_milk', 'Amul High Protein Milk', 'amul protein milk tetra pack', { per: 250, kcal: 225, p: 35, c: 20, f: 0.5 }, [['1 pack', 250]], 'Amul label per 250 ml pack');
b('amul_protein_buttermilk', 'Amul High Protein Buttermilk', 'amul protein chaas', { per: 200, kcal: 108, p: 15, c: 8, f: 1 }, [['1 pack', 200]], 'Amul label per 200 ml pack');
b('amul_protein_lassi', 'Amul High Protein Lassi', 'amul protein lassi', { per: 200, kcal: 107, p: 15, c: 12, f: 1.7 }, [['1 pack', 200]], 'Amul label per 200 ml pack');
b('amul_cheese_slice', 'Amul Cheese Slice', 'amul processed cheese', { per: 100, kcal: 316, p: 18, c: 4.8, f: 25 }, [['1 slice', 20]], 'Amul label per 100 g');

/* ── Chocolate, sweets, spreads ── */
b('dairy_milk', 'Cadbury Dairy Milk', 'cadbury chocolate', { per: 100, kcal: 521, p: 7.7, c: 59, f: 27.5 }, [['1 small bar', 13], ['1 bar', 50], ['1 row (4 pieces)', 9]], 'Cadbury label per 100 g');
b('five_star', 'Cadbury 5 Star', '5star chocolate', { per: 48.5, kcal: 256, p: 2.5, c: 29, f: 13.6 }, [['1 bar', 40], ['1 small bar', 22]], 'Cadbury label: 256 kcal per 48.5 g');
b('kitkat', 'Nestlé KitKat', 'kit kat chocolate', { per: 20, kcal: 100, p: 1.4, c: 12, f: 5.1 }, [['1 two-finger bar', 18], ['1 four-finger bar', 37]], 'Nestlé label: 100 kcal per 20 g');
b('snickers', 'Snickers', 'chocolate bar', { per: 50, kcal: 245, p: 4.3, c: 30, f: 11.6 }, [['1 bar', 50]], 'Mars label: 1 bar 50 g');
b('hershey_bar', "Hershey's Milk Chocolate Bar", 'hersheys chocolate', { per: 43, kcal: 210, p: 3, c: 26, f: 13 }, [['1 bar', 43]], "Hershey's label: 1 bar 43 g");
b('hershey_syrup', "Hershey's Chocolate Syrup", 'hersheys syrup chocolate sauce', { per: 39, kcal: 100, p: 0, c: 24, f: 0 }, [['1 tbsp', 20], ['2 tbsp', 39]], "Hershey's label: 2 tbsp 39 g");
b('alpenliebe', 'Alpenliebe (candy / lollipop)', 'alpenlibe toffee caramel candy', { per: 100, kcal: 397, p: 1.4, c: 92, f: 2.6 }, [['1 candy', 4.5], ['1 lollipop', 10]], 'Alpenliebe label per 100 g; piece weights approximate');
b('nutella', 'Nutella', 'hazelnut spread chocolate', { per: 15, kcal: 79, p: 0.9, c: 8.6, f: 4.6 }, [['1 tbsp', 15], ['1 tsp', 5]], 'Ferrero label: 1 tbsp 15 g');
b('bournvita', 'Cadbury Bournvita (powder)', 'bournvita malt drink', { per: 100, kcal: 393, p: 7, c: 85.2, f: 1.8 }, [['1 serving', 20], ['1 tsp', 10]], 'Cadbury label per 100 g');

/* ── Drinks ── */
b('red_bull', 'Red Bull Energy Drink', 'redbull energy', { per: 250, kcal: 116, p: 0, c: 27, f: 0 }, [['1 can', 250]], 'Red Bull label per 250 ml can');

export default brands;
