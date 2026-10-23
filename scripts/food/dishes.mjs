// Standard Indian meals, written as the raw ingredients in ONE serving.
// build-food.mjs turns each into calories and macros from IFCT 2017 / USDA values in ifct.json + extras.json.
//
// d(id, name, aliases, category, diet, unit, cookedGrams, recipe, altUnits?)
//   diet: 'v' veg · 'e' contains egg · 'n' non-veg
//   unit: what one serving is called ("katori", "piece", "plate"…), shown as "1 katori (150 g)"
//   recipe: { ingredientId: raw grams } — water, salt and whole spices are left out (≈0 kcal).
//           '@dishId': n  includes n servings of another dish (used for thalis and combos).
//   altUnits: other ways to log it, [[label, cooked grams]]; nutrition scales by weight.
//
// Assumptions are home-style unless the name says restaurant. Oil for deep-fried items is what the food
// absorbs (~10–15% of fried weight), not what's in the kadhai. One katori = 150 g cooked unless noted.

const dishes = [];
const d = (id, name, aka, cat, diet, unit, g, recipe, alt = []) => dishes.push({ id, name, aka, cat, diet, unit, g, recipe, alt });

/* ── Breakfast ── */
d('poha', 'Poha', 'aval kanda poha', 'breakfast', 'v', 'plate', 180, { poha: 50, oil: 7, onion: 25, potato: 20, peanuts: 8, peas: 10 });
d('upma', 'Upma (rava)', 'uppittu sooji upma', 'breakfast', 'v', 'plate', 200, { sooji: 50, oil: 8, onion: 20, peas: 10, carrot: 10, chana_dal: 2 });
d('idli', 'Idli', 'idly', 'breakfast', 'v', 'piece', 40, { rice: 11, urad_dal: 4 });
d('dosa', 'Plain dosa', 'sada dosa', 'breakfast', 'v', 'dosa', 80, { rice: 25, urad_dal: 8, oil: 4 });
d('masala_dosa', 'Masala dosa', 'potato dosa', 'breakfast', 'v', 'dosa', 200, { rice: 25, urad_dal: 8, oil: 11, potato: 100, onion: 15 });
d('rava_dosa', 'Rava dosa', 'sooji dosa', 'breakfast', 'v', 'dosa', 90, { sooji: 20, rice_flour: 15, maida: 5, oil: 8, onion: 10 });
d('uttapam', 'Uttapam (onion-tomato)', 'uthappam', 'breakfast', 'v', 'piece', 150, { rice: 35, urad_dal: 10, onion: 20, tomato: 15, oil: 6 });
d('medu_vada', 'Medu vada', 'uddina vada ulundu vadai', 'breakfast', 'v', 'piece', 45, { urad_dal: 20, oil: 7 });
d('pesarattu', 'Pesarattu (moong dosa)', 'green moong dosa', 'breakfast', 'v', 'dosa', 90, { moong_whole: 35, oil: 4, onion: 10 });
d('appam', 'Appam', 'palappam', 'breakfast', 'v', 'piece', 60, { rice: 22, coconut: 5, sugar: 2 });
d('idli_sambar', 'Idli sambar (2 idli + sambar + chutney)', 'idly sambar', 'breakfast', 'v', 'plate', 290, { '@idli': 2, '@sambar': 1, '@coconut_chutney': 2 });
d('aloo_paratha', 'Aloo paratha', 'potato paratha', 'breakfast', 'v', 'paratha', 120, { atta: 45, potato: 50, ghee: 7, onion: 5 });
d('paneer_paratha', 'Paneer paratha', '', 'breakfast', 'v', 'paratha', 120, { atta: 45, paneer: 30, ghee: 7, onion: 5 });
d('gobi_paratha', 'Gobhi paratha', 'cauliflower paratha', 'breakfast', 'v', 'paratha', 120, { atta: 45, cauliflower: 50, ghee: 7 });
d('mooli_paratha', 'Mooli paratha', 'radish paratha', 'breakfast', 'v', 'paratha', 120, { atta: 45, mooli: 50, ghee: 7 });
d('methi_thepla', 'Methi thepla', 'thepla', 'breakfast', 'v', 'piece', 40, { atta: 25, besan: 3, methi_leaves: 5, oil: 4, curd: 3 });
d('besan_chilla', 'Besan chilla', 'besan cheela pudla', 'breakfast', 'v', 'piece', 80, { besan: 30, onion: 15, tomato: 10, oil: 4 });
d('moong_chilla', 'Moong dal chilla', 'moong cheela', 'breakfast', 'v', 'piece', 80, { moong_dal: 30, onion: 10, oil: 4 });
d('omelette', 'Masala omelette (2 eggs)', 'omlet anda', 'breakfast', 'e', 'omelette', 130, { egg: 100, oil: 5, onion: 15, tomato: 10 });
d('egg_bhurji', 'Egg bhurji (2 eggs)', 'anda bhurji scrambled eggs', 'breakfast', 'e', 'katori', 140, { egg: 100, oil: 7, onion: 20, tomato: 15 });
d('boiled_egg', 'Boiled egg', 'ubla anda', 'breakfast', 'e', 'egg', 50, { egg: 50 });
d('bread_omelette', 'Bread omelette', '', 'breakfast', 'e', 'plate', 170, { bread: 50, egg: 100, oil: 5, butter: 5, onion: 10 });
d('bread_butter', 'Bread butter (2 slices)', 'toast', 'breakfast', 'v', 'plate', 60, { bread: 50, butter: 10 });
d('sprouts', 'Sprouts salad', 'moong sprouts chaat', 'breakfast', 'v', 'katori', 150, { moong_whole: 40, onion: 15, tomato: 15, lemon_juice: 5 });
d('oats_milk', 'Oats with milk', 'oatmeal porridge', 'breakfast', 'v', 'bowl', 250, { oats: 40, toned_milk: 200, sugar: 5 });
d('cornflakes_milk', 'Cornflakes with milk', 'cereal', 'breakfast', 'v', 'bowl', 230, { cornflakes: 30, toned_milk: 200, sugar: 5 });
d('sabudana_khichdi', 'Sabudana khichdi', 'sago khichdi', 'breakfast', 'v', 'plate', 200, { sabudana: 60, peanuts: 15, potato: 30, ghee: 8 });
d('dhokla', 'Khaman dhokla', 'dhokla', 'breakfast', 'v', 'piece', 40, { besan: 12, oil: 2, sugar: 1.5 }, [['2 pieces', 80]]);
d('vermicelli_upma', 'Vermicelli upma', 'semiya upma seviyan', 'breakfast', 'v', 'plate', 200, { vermicelli: 50, oil: 7, onion: 20, peas: 10, carrot: 10 });

/* ── Breads ── */
d('roti', 'Roti / chapati', 'phulka chapathi', 'breads', 'v', 'roti', 40, { atta: 25 });
d('roti_ghee', 'Roti with ghee', 'chapati ghee', 'breads', 'v', 'roti', 43, { atta: 25, ghee: 3 });
d('tandoori_roti', 'Tandoori roti', '', 'breads', 'v', 'roti', 60, { atta: 40 });
d('naan', 'Plain naan', 'nan', 'breads', 'v', 'naan', 90, { maida: 55, curd: 8, oil: 3 });
d('butter_naan', 'Butter naan', 'garlic naan', 'breads', 'v', 'naan', 97, { maida: 55, curd: 8, oil: 3, butter: 7 });
d('kulcha', 'Kulcha', 'amritsari kulcha', 'breads', 'v', 'kulcha', 100, { maida: 55, oil: 4, butter: 5, potato: 20 });
d('rumali_roti', 'Rumali roti', '', 'breads', 'v', 'roti', 50, { maida: 30, atta: 5 });
d('paratha', 'Plain paratha', 'parantha', 'breads', 'v', 'paratha', 60, { atta: 40, ghee: 6 });
d('laccha_paratha', 'Laccha paratha', 'lachha', 'breads', 'v', 'paratha', 70, { atta: 45, ghee: 10 });
d('missi_roti', 'Missi roti', '', 'breads', 'v', 'roti', 55, { atta: 20, besan: 15, ghee: 4 });
d('puri', 'Puri', 'poori', 'breads', 'v', 'puri', 25, { atta: 15, oil: 6 });
d('bhatura', 'Bhatura', 'bhature', 'breads', 'v', 'bhatura', 80, { maida: 45, curd: 8, oil: 12 });
d('makki_roti', 'Makki ki roti', 'corn roti', 'breads', 'v', 'roti', 70, { makki_atta: 45, ghee: 5 });
d('bajra_roti', 'Bajra roti', 'bajre ki roti', 'breads', 'v', 'roti', 60, { bajra: 40 });
d('jowar_bhakri', 'Jowar bhakri / roti', 'jolada rotti', 'breads', 'v', 'roti', 60, { jowar: 40 });
d('baati', 'Baati (with ghee)', 'dal baati', 'breads', 'v', 'baati', 75, { atta: 50, ghee: 12 });
d('puran_poli', 'Puran poli', 'holige obbattu', 'breads', 'v', 'piece', 80, { atta: 25, maida: 5, chana_dal: 25, jaggery: 25, ghee: 5 });

/* ── Rice ── */
d('rice', 'Steamed rice', 'chawal bhaat plain rice', 'rice', 'v', 'katori', 150, { rice: 50 }, [['1 plate', 250]]);
d('brown_rice_cooked', 'Brown rice', '', 'rice', 'v', 'katori', 150, { brown_rice: 50 }, [['1 plate', 250]]);
d('jeera_rice', 'Jeera rice', 'cumin rice', 'rice', 'v', 'katori', 150, { rice: 50, ghee: 5 }, [['1 plate', 250]]);
d('veg_pulao', 'Veg pulao', 'pulav', 'rice', 'v', 'plate', 250, { rice: 70, peas: 15, carrot: 15, french_beans: 10, onion: 15, oil: 8 });
d('veg_biryani', 'Veg biryani', 'biriyani', 'rice', 'v', 'plate', 300, { rice: 80, potato: 20, carrot: 15, french_beans: 15, peas: 10, curd: 20, onion: 30, oil: 12 });
d('chicken_biryani', 'Chicken biryani', 'murgh biriyani hyderabadi', 'rice', 'n', 'plate', 350, { rice: 80, chicken_leg: 90, curd: 25, onion: 30, ghee: 15 });
d('mutton_biryani', 'Mutton biryani', 'gosht biriyani', 'rice', 'n', 'plate', 350, { rice: 80, mutton: 90, curd: 25, onion: 30, ghee: 15 });
d('egg_biryani', 'Egg biryani', 'anda biriyani', 'rice', 'e', 'plate', 320, { rice: 80, egg: 100, curd: 20, onion: 30, oil: 12 });
d('curd_rice', 'Curd rice', 'dahi chawal thayir sadam', 'rice', 'v', 'katori', 200, { rice: 40, curd: 100, oil: 3 });
d('lemon_rice', 'Lemon rice', 'chitranna nimbu chawal', 'rice', 'v', 'plate', 200, { rice: 60, peanuts: 10, oil: 8, chana_dal: 3 });
d('khichdi', 'Dal khichdi', 'khichri', 'rice', 'v', 'katori', 200, { rice: 30, moong_dal: 20, ghee: 5 });
d('bisi_bele_bath', 'Bisi bele bath', 'sambar rice', 'rice', 'v', 'plate', 250, { rice: 40, toor_dal: 20, carrot: 15, french_beans: 15, peas: 10, ghee: 8 });
d('veg_fried_rice', 'Veg fried rice', 'chinese', 'rice', 'v', 'plate', 250, { rice: 70, oil: 12, cabbage: 20, carrot: 15, capsicum: 10, french_beans: 10 });
d('chicken_fried_rice', 'Chicken fried rice', 'egg fried rice', 'rice', 'n', 'plate', 280, { rice: 70, oil: 12, egg: 25, chicken_breast: 40, cabbage: 15, carrot: 15 });
d('hakka_noodles', 'Veg hakka noodles', 'chowmein noodles', 'rice', 'v', 'plate', 250, { noodles: 70, oil: 12, cabbage: 30, carrot: 15, capsicum: 15, onion: 15 });
d('maggi', 'Instant noodles (1 pack)', 'maggi', 'rice', 'v', 'pack', 200, { instant_noodles: 70 });
d('pasta_red', 'Pasta (red sauce)', 'penne arrabiata', 'rice', 'v', 'plate', 250, { pasta: 70, tomato: 80, oil: 8, onion: 15, cheese: 5 });

/* ── Dals ── */
d('dal_tadka', 'Dal tadka (toor)', 'arhar dal yellow dal', 'dal', 'v', 'katori', 150, { toor_dal: 30, ghee: 4, onion: 15, tomato: 20 });
d('dal_fry', 'Dal fry', 'restaurant dal', 'dal', 'v', 'katori', 150, { toor_dal: 30, oil: 7, onion: 20, tomato: 20 });
d('moong_dal', 'Moong dal', 'yellow moong dal', 'dal', 'v', 'katori', 150, { moong_dal: 28, ghee: 3, tomato: 10 });
d('masoor_dal', 'Masoor dal', 'red lentil dal', 'dal', 'v', 'katori', 150, { masoor_dal: 28, oil: 4, onion: 10, tomato: 10 });
d('chana_dal', 'Chana dal', 'bengal gram dal', 'dal', 'v', 'katori', 150, { chana_dal: 30, oil: 5, onion: 10, tomato: 15 });
d('dal_makhani', 'Dal makhani', 'maa di dal kali dal', 'dal', 'v', 'katori', 150, { urad_whole: 25, rajma: 5, butter: 10, cream: 15, tomato: 25 });
d('rajma', 'Rajma', 'rajma masala kidney beans curry', 'dal', 'v', 'katori', 150, { rajma: 35, onion: 20, tomato: 30, oil: 6 });
d('chole', 'Chole / chana masala', 'chhole chickpea curry', 'dal', 'v', 'katori', 150, { kabuli_chana: 40, onion: 25, tomato: 30, oil: 8 });
d('kala_chana_curry', 'Kala chana curry', 'black chana', 'dal', 'v', 'katori', 150, { kala_chana: 35, oil: 5, onion: 15, tomato: 20 });
d('sabut_moong', 'Sabut moong dal', 'whole moong curry', 'dal', 'v', 'katori', 150, { moong_whole: 30, oil: 4, onion: 10, tomato: 15 });
d('lobia', 'Lobia curry', 'chawli black eyed beans', 'dal', 'v', 'katori', 150, { lobia: 30, oil: 5, onion: 15, tomato: 20 });
d('dal_palak', 'Dal palak', 'spinach dal', 'dal', 'v', 'katori', 150, { toor_dal: 25, spinach: 40, ghee: 4, tomato: 10 });
d('sambar', 'Sambar', 'sambhar', 'dal', 'v', 'katori', 150, { toor_dal: 15, drumstick: 10, pumpkin: 15, onion: 10, tomato: 15, oil: 4 });
d('rasam', 'Rasam', 'saaru chaaru', 'dal', 'v', 'katori', 150, { toor_dal: 5, tomato: 30, ghee: 2 });
d('kadhi', 'Kadhi (plain)', 'kadi', 'dal', 'v', 'katori', 180, { curd: 100, besan: 12, oil: 3 });
d('kadhi_pakora', 'Kadhi pakora', 'kadi pakoda', 'dal', 'v', 'katori', 200, { curd: 100, besan: 27, onion: 15, oil: 11 });

/* ── Sabzi & veg curries ── */
d('aloo_gobi', 'Aloo gobhi', 'potato cauliflower', 'sabzi', 'v', 'katori', 150, { potato: 60, cauliflower: 70, oil: 7, onion: 10, tomato: 10 });
d('aloo_matar', 'Aloo matar', 'potato peas curry', 'sabzi', 'v', 'katori', 150, { potato: 60, peas: 40, tomato: 30, onion: 15, oil: 7 });
d('jeera_aloo', 'Jeera aloo / aloo sabzi', 'potato sabji dry', 'sabzi', 'v', 'katori', 150, { potato: 120, oil: 7 });
d('bhindi', 'Bhindi masala', 'okra ladies finger', 'sabzi', 'v', 'katori', 150, { bhindi: 120, onion: 25, oil: 9 });
d('baingan_bharta', 'Baingan bharta', 'brinjal bharta', 'sabzi', 'v', 'katori', 150, { brinjal: 130, onion: 20, tomato: 20, oil: 7 });
d('mix_veg', 'Mix veg', 'mixed vegetable sabzi', 'sabzi', 'v', 'katori', 150, { potato: 30, carrot: 20, french_beans: 20, peas: 20, cauliflower: 30, tomato: 15, onion: 15, oil: 7 });
d('lauki', 'Lauki / tori / tinda sabzi', 'ghiya turai', 'sabzi', 'v', 'katori', 150, { lauki: 140, oil: 5, tomato: 15 });
d('cabbage_matar', 'Patta gobhi matar', 'cabbage sabzi', 'sabzi', 'v', 'katori', 150, { cabbage: 110, peas: 20, oil: 6 });
d('karela', 'Karela sabzi', 'bitter gourd', 'sabzi', 'v', 'katori', 120, { karela: 100, onion: 30, oil: 8 });
d('methi_aloo', 'Aloo methi', 'methi aloo', 'sabzi', 'v', 'katori', 150, { potato: 80, methi_leaves: 40, oil: 7 });
d('sarson_saag', 'Sarson ka saag', 'saag', 'sabzi', 'v', 'katori', 150, { sarson: 120, spinach: 30, makki_atta: 5, ghee: 8, butter: 5 });
d('palak_paneer', 'Palak paneer', 'saag paneer', 'sabzi', 'v', 'katori', 150, { spinach: 100, paneer: 50, oil: 5, cream: 5, onion: 15, tomato: 10 });
d('paneer_butter_masala', 'Paneer butter masala', 'paneer makhani', 'sabzi', 'v', 'katori', 150, { paneer: 70, butter: 10, cream: 15, tomato: 50, cashew: 5, oil: 3, sugar: 2 });
d('kadai_paneer', 'Kadai paneer', 'karahi paneer', 'sabzi', 'v', 'katori', 150, { paneer: 70, capsicum: 30, onion: 25, tomato: 40, oil: 10 });
d('shahi_paneer', 'Shahi paneer', '', 'sabzi', 'v', 'katori', 150, { paneer: 60, cream: 15, cashew: 8, curd: 15, oil: 6, onion: 20 });
d('matar_paneer', 'Matar paneer', 'mutter paneer', 'sabzi', 'v', 'katori', 150, { paneer: 50, peas: 40, tomato: 40, onion: 20, oil: 8 });
d('paneer_bhurji', 'Paneer bhurji', '', 'sabzi', 'v', 'katori', 150, { paneer: 100, onion: 20, tomato: 20, oil: 7 });
d('malai_kofta', 'Malai kofta', '', 'sabzi', 'v', 'katori', 180, { paneer: 30, potato: 40, maida: 5, oil: 13, cream: 15, cashew: 8, tomato: 40, butter: 5 });
d('dum_aloo', 'Dum aloo', '', 'sabzi', 'v', 'katori', 150, { potato: 100, curd: 25, oil: 12, onion: 10 });
d('veg_korma', 'Veg korma / navratan', 'kurma', 'sabzi', 'v', 'katori', 150, { potato: 30, carrot: 20, french_beans: 20, peas: 15, cauliflower: 15, coconut: 10, cashew: 6, cream: 10, oil: 7 });
d('mushroom_matar', 'Mushroom matar', '', 'sabzi', 'v', 'katori', 150, { mushroom: 70, peas: 40, tomato: 30, onion: 15, oil: 7 });
d('soya_curry', 'Soya chunks curry', 'meal maker curry nutrela', 'sabzi', 'v', 'katori', 150, { soya_chunks: 30, onion: 20, tomato: 30, oil: 7 });
d('avial', 'Avial', 'aviyal', 'sabzi', 'v', 'katori', 150, { raw_banana: 30, drumstick: 20, carrot: 20, french_beans: 20, pumpkin: 20, coconut: 20, curd: 15, coconut_oil: 6 });
d('beans_poriyal', 'Beans poriyal / thoran', 'palya', 'sabzi', 'v', 'katori', 120, { french_beans: 110, coconut: 15, coconut_oil: 5 });
d('gatte', 'Gatte ki sabzi', 'besan gatte', 'sabzi', 'v', 'katori', 150, { besan: 30, curd: 40, oil: 10 });
d('pav_bhaji', 'Pav bhaji (bhaji + 2 pav)', '', 'snacks', 'v', 'plate', 300, { potato: 60, peas: 20, cauliflower: 20, capsicum: 15, tomato: 50, onion: 25, butter: 20, pav: 80 });

/* ── Non-veg ── */
d('chicken_curry', 'Chicken curry (home-style)', 'murgh curry', 'nonveg', 'n', 'katori', 180, { chicken_leg: 100, onion: 30, tomato: 30, oil: 10, curd: 10 });
d('butter_chicken', 'Butter chicken', 'murgh makhani', 'nonveg', 'n', 'katori', 180, { chicken_thigh: 100, butter: 10, cream: 20, tomato: 50, cashew: 5, oil: 4 });
d('kadai_chicken', 'Kadai chicken', 'karahi chicken', 'nonveg', 'n', 'katori', 180, { chicken_leg: 100, capsicum: 30, onion: 25, tomato: 40, oil: 12 });
d('chicken_tikka', 'Chicken tikka (6 pieces)', 'tikka kebab', 'nonveg', 'n', 'plate', 150, { chicken_breast: 160, curd: 20, oil: 5 });
d('tandoori_chicken', 'Tandoori chicken (half)', '', 'nonveg', 'n', 'half', 250, { chicken_leg: 120, chicken_breast: 100, curd: 25, oil: 6 });
d('grilled_chicken', 'Grilled chicken breast', 'boiled chicken', 'nonveg', 'n', 'breast', 150, { chicken_breast: 200, oil: 5 });
d('chilli_chicken', 'Chilli chicken (dry)', 'chinese', 'nonveg', 'n', 'plate', 200, { chicken_breast: 120, cornflour: 12, maida: 5, oil: 18, capsicum: 30, onion: 30, ketchup: 10 });
d('chicken_65', 'Chicken 65', '', 'nonveg', 'n', 'plate', 150, { chicken_thigh: 120, cornflour: 10, besan: 5, oil: 15 });
d('seekh_kebab', 'Chicken seekh kebab (2)', 'kabab', 'nonveg', 'n', 'plate', 80, { chicken_thigh: 80, oil: 3, onion: 10 });
d('chicken_roll', 'Chicken kathi roll', 'frankie shawarma wrap', 'nonveg', 'n', 'roll', 200, { maida: 50, oil: 6, chicken_thigh: 70, onion: 15, mayonnaise: 10 });
d('egg_curry', 'Egg curry (2 eggs)', 'anda curry', 'nonveg', 'e', 'katori', 200, { egg: 100, onion: 30, tomato: 30, oil: 10 });
d('mutton_curry', 'Mutton curry', 'gosht curry', 'nonveg', 'n', 'katori', 180, { mutton: 100, onion: 30, tomato: 25, oil: 10, curd: 10 });
d('rogan_josh', 'Rogan josh', '', 'nonveg', 'n', 'katori', 180, { mutton: 100, curd: 30, ghee: 12 });
d('keema', 'Keema matar', 'kheema mince', 'nonveg', 'n', 'katori', 150, { mutton: 90, peas: 25, onion: 25, tomato: 25, oil: 8 });
d('fish_curry', 'Fish curry', 'machli macher jhol', 'nonveg', 'n', 'katori', 180, { rohu: 100, onion: 20, tomato: 25, mustard_oil: 8 });
d('fish_fry', 'Fish fry', 'tawa fish rava fry', 'nonveg', 'n', 'piece', 80, { rohu: 90, rice_flour: 8, oil: 8 });
d('prawn_curry', 'Prawn curry', 'jhinga curry coconut', 'nonveg', 'n', 'katori', 180, { prawns: 100, coconut_milk: 40, onion: 20, oil: 6 });
d('chicken_momos', 'Chicken momos (6)', 'dumplings', 'nonveg', 'n', 'plate', 180, { maida: 60, chicken_thigh: 60, onion: 15, oil: 2 });

/* ── Snacks & street food ── */
d('samosa', 'Samosa', 'aloo samosa', 'snacks', 'v', 'piece', 80, { maida: 28, potato: 40, peas: 5, oil: 13 });
d('kachori', 'Kachori', 'khasta kachori', 'snacks', 'v', 'piece', 60, { maida: 25, moong_dal: 10, oil: 12 });
d('pakora', 'Onion pakora (4 pieces)', 'bhajiya pakoda', 'snacks', 'v', 'plate', 80, { besan: 28, onion: 45, oil: 16 });
d('bread_pakora', 'Bread pakora', '', 'snacks', 'v', 'piece', 110, { bread: 50, potato: 30, besan: 15, oil: 12 });
d('vada_pav', 'Vada pav', 'wada pav', 'snacks', 'v', 'piece', 150, { pav: 40, potato: 70, besan: 12, oil: 12 });
d('misal_pav', 'Misal pav (with 2 pav)', 'misal', 'snacks', 'v', 'plate', 350, { moth: 35, onion: 20, tomato: 15, oil: 14, besan: 10, pav: 80 });
d('chole_bhature', 'Chole bhature (2 bhature)', 'chhole bhature', 'snacks', 'v', 'plate', 310, { '@chole': 1, '@bhatura': 2 });
d('pani_puri', 'Pani puri (6)', 'golgappa puchka', 'snacks', 'v', 'plate', 150, { sooji: 12, oil: 6, potato: 20, kala_chana: 5, sugar: 6 });
d('bhel', 'Bhel puri', 'bhelpuri', 'snacks', 'v', 'plate', 120, { murmura: 30, besan: 8, oil: 5, peanuts: 5, onion: 15, tomato: 10, potato: 15, sugar: 8 });
d('sev_puri', 'Sev puri (6)', '', 'snacks', 'v', 'plate', 130, { maida: 15, oil: 13, potato: 25, besan: 8, sugar: 8, onion: 10 });
d('papdi_chaat', 'Papdi chaat / dahi puri', 'dahi papdi', 'snacks', 'v', 'plate', 200, { maida: 20, oil: 11, curd: 60, potato: 25, kala_chana: 10, sugar: 10, besan: 5 });
d('aloo_tikki', 'Aloo tikki (2)', 'tikki chaat', 'snacks', 'v', 'plate', 130, { potato: 120, oil: 10, cornflour: 5, peas: 10 });
d('dabeli', 'Dabeli', 'kutchi dabeli', 'snacks', 'v', 'piece', 120, { pav: 40, potato: 50, peanuts: 8, oil: 6, sugar: 5 });
d('veg_sandwich', 'Veg sandwich (grilled)', 'bombay sandwich', 'snacks', 'v', 'sandwich', 150, { bread: 50, butter: 8, cucumber: 20, tomato: 20, potato: 30 });
d('cheese_sandwich', 'Cheese sandwich (grilled)', 'cheese toast', 'snacks', 'v', 'sandwich', 140, { bread: 50, butter: 8, cheese: 20, tomato: 20, onion: 10 });
d('veg_puff', 'Veg puff', 'bakery puff', 'snacks', 'v', 'piece', 90, { maida: 40, vanaspati: 15, potato: 30, peas: 5 });
d('veg_momos', 'Veg momos (6)', 'dumplings', 'snacks', 'v', 'plate', 180, { maida: 60, cabbage: 50, carrot: 15, onion: 15, oil: 4 });
d('pizza_slice', 'Pizza (1 slice, medium)', 'margherita', 'snacks', 'v', 'slice', 100, { maida: 40, cheese: 20, oil: 4, tomato: 15 });
d('veg_burger', 'Veg burger (aloo tikki)', '', 'snacks', 'v', 'burger', 170, { pav: 60, potato: 60, oil: 10, mayonnaise: 10, tomato: 10 });
d('fries', 'French fries (medium)', 'chips', 'snacks', 'v', 'portion', 115, { potato: 170, oil: 16 });
d('makhana_roasted', 'Roasted makhana', 'fox nuts', 'snacks', 'v', 'katori', 25, { makhana: 25, ghee: 3 });
d('roasted_chana', 'Roasted chana', 'bhuna chana', 'snacks', 'v', 'handful', 30, { kala_chana: 30 });
d('namkeen', 'Namkeen / bhujia', 'aloo bhujia mixture', 'snacks', 'v', 'handful', 30, { besan: 15, oil: 10, potato: 5 });
d('banana_chips', 'Banana chips', 'kele chips', 'snacks', 'v', 'handful', 30, { raw_banana: 55, coconut_oil: 10 });

/* ── Sweets ── */
d('gulab_jamun', 'Gulab jamun', '', 'sweets', 'v', 'piece', 40, { khoa: 10, maida: 3, sugar: 12, ghee: 4 });
d('rasgulla', 'Rasgulla', 'rosogolla', 'sweets', 'v', 'piece', 50, { paneer: 15, sugar: 15 });
d('rasmalai', 'Rasmalai', '', 'sweets', 'v', 'piece', 70, { paneer: 15, fullcream_milk: 50, sugar: 12 });
d('jalebi', 'Jalebi (3 pieces)', 'jilebi', 'sweets', 'v', 'plate', 75, { maida: 23, sugar: 30, oil: 9 });
d('kaju_katli', 'Kaju katli', 'kaju barfi', 'sweets', 'v', 'piece', 20, { cashew: 11, sugar: 8, ghee: 0.5 });
d('besan_ladoo', 'Besan ladoo', 'laddu', 'sweets', 'v', 'ladoo', 35, { besan: 15, ghee: 9, sugar: 11 });
d('motichoor_ladoo', 'Motichoor / boondi ladoo', 'laddu', 'sweets', 'v', 'ladoo', 35, { besan: 10, oil: 7, sugar: 15 });
d('barfi', 'Milk barfi', 'burfi peda', 'sweets', 'v', 'piece', 30, { khoa: 18, sugar: 10 });
d('mysore_pak', 'Mysore pak', '', 'sweets', 'v', 'piece', 30, { besan: 8, ghee: 12, sugar: 12 });
d('gajar_halwa', 'Gajar halwa', 'carrot halwa', 'sweets', 'v', 'katori', 100, { carrot: 80, fullcream_milk: 80, sugar: 15, ghee: 8, khoa: 10 });
d('sooji_halwa', 'Sooji halwa / sheera', 'rava kesari', 'sweets', 'v', 'katori', 100, { sooji: 25, ghee: 12, sugar: 20 });
d('kheer', 'Rice kheer', 'payasam', 'sweets', 'v', 'katori', 150, { fullcream_milk: 180, rice: 10, sugar: 15, almond: 3 });
d('semiya_payasam', 'Seviyan kheer / semiya payasam', 'vermicelli kheer', 'sweets', 'v', 'katori', 150, { vermicelli: 15, fullcream_milk: 150, sugar: 15, ghee: 3 });
d('shrikhand', 'Shrikhand', '', 'sweets', 'v', 'katori', 100, { curd: 70, cream: 10, sugar: 25 });
d('kulfi', 'Kulfi', '', 'sweets', 'v', 'piece', 70, { fullcream_milk: 140, sugar: 12, pistachio: 3 });
d('modak', 'Modak (steamed)', 'ukadiche modak', 'sweets', 'v', 'piece', 45, { rice_flour: 15, coconut: 12, jaggery: 10, ghee: 2 });
d('chikki', 'Peanut chikki', 'gajak', 'sweets', 'v', 'piece', 25, { peanuts: 13, jaggery: 12 });

/* ── Drinks ── */
d('chai', 'Chai (with milk & sugar)', 'masala tea cutting', 'drinks', 'v', 'cup', 150, { toned_milk: 60, sugar: 7 }, [['Cutting (½ cup)', 75]]);
d('coffee_milk', 'Coffee with milk & sugar', 'filter coffee nescafe', 'drinks', 'v', 'cup', 150, { toned_milk: 90, sugar: 7 });
d('lassi', 'Sweet lassi', 'meethi lassi', 'drinks', 'v', 'glass', 250, { curd: 150, sugar: 20 });
d('chaas', 'Chaas / buttermilk', 'mattha majjige', 'drinks', 'v', 'glass', 250, { curd: 60 });
d('mango_shake', 'Mango shake', 'aam shake', 'drinks', 'v', 'glass', 250, { mango: 80, toned_milk: 150, sugar: 15 });
d('banana_shake', 'Banana shake', '', 'drinks', 'v', 'glass', 280, { banana: 100, toned_milk: 180, sugar: 10 });
d('cold_coffee', 'Cold coffee', '', 'drinks', 'v', 'glass', 250, { toned_milk: 200, sugar: 15, ice_cream: 30 });
d('badam_milk', 'Badam milk', 'almond milk', 'drinks', 'v', 'glass', 220, { fullcream_milk: 200, almond: 10, sugar: 15 });
d('nimbu_pani', 'Nimbu pani (sweet)', 'lemonade shikanji', 'drinks', 'v', 'glass', 250, { lemon_juice: 15, sugar: 20 });
d('mosambi_juice', 'Fresh mosambi / orange juice', 'juice', 'drinks', 'v', 'glass', 250, { mosambi: 250 });
d('protein_shake_milk', 'Protein shake (1 scoop + milk)', 'whey shake', 'drinks', 'v', 'glass', 280, { whey: 30, toned_milk: 250 });
d('protein_shake_water', 'Protein shake (1 scoop + water)', 'whey', 'drinks', 'v', 'glass', 280, { whey: 30 });
d('milk_glass', 'Glass of milk (toned)', 'doodh', 'drinks', 'v', 'glass', 250, { toned_milk: 250 });

/* ── Sides ── */
d('raita', 'Cucumber raita', 'raita', 'sides', 'v', 'katori', 100, { curd: 90, cucumber: 20 });
d('boondi_raita', 'Boondi raita', '', 'sides', 'v', 'katori', 100, { curd: 90, besan: 8, oil: 5 });
d('curd_katori', 'Curd / dahi', 'yogurt', 'sides', 'v', 'katori', 150, { curd: 150 });
d('salad', 'Green salad', 'kachumber', 'sides', 'v', 'plate', 110, { cucumber: 40, tomato: 30, onion: 20, carrot: 20, lemon_juice: 5 });
d('papad', 'Papad (roasted)', 'papadum appalam', 'sides', 'v', 'papad', 12, { urad_dal: 12 });
d('papad_fried', 'Papad (fried)', 'papadum', 'sides', 'v', 'papad', 16, { urad_dal: 12, oil: 4 });
d('pickle', 'Pickle (achaar)', 'achar', 'sides', 'v', 'tbsp', 15, { raw_mango: 8, mustard_oil: 5 });
d('green_chutney', 'Green chutney', 'hari chutney pudina', 'sides', 'v', 'tbsp', 15, { coriander: 7.5, mint: 4, lemon_juice: 2.5 });
d('coconut_chutney', 'Coconut chutney', 'nariyal chutney', 'sides', 'v', 'tbsp', 15, { coconut: 7.5, chana_dal: 1.5, oil: 0.5 });
d('imli_chutney', 'Imli / sonth chutney', 'meethi chutney tamarind', 'sides', 'v', 'tbsp', 15, { jaggery: 7.5 });

/* ── Thalis & combos ── */
d('veg_thali', 'North Indian veg thali', 'thali meals', 'thali', 'v', 'thali', 700, { '@roti': 3, '@dal_tadka': 1, '@mix_veg': 1, '@rice': 1, '@raita': 1, '@salad': 1, '@pickle': 1 });
d('south_meals', 'South Indian meals', 'thali full meals', 'thali', 'v', 'thali', 800, { '@rice': 2, '@sambar': 1, '@rasam': 1, '@beans_poriyal': 1, '@curd_katori': 1, '@papad_fried': 1, '@pickle': 1 });
d('gujarati_thali', 'Gujarati thali', 'thali', 'thali', 'v', 'thali', 810, { '@roti_ghee': 3, '@dal_tadka': 1, '@aloo_matar': 1, '@kadhi': 1, '@rice': 1, '@dhokla': 2, '@shrikhand': 0.5, '@papad': 1 });
d('rajma_chawal', 'Rajma chawal', 'rajma rice', 'thali', 'v', 'plate', 375, { '@rajma': 1, '@rice': 1.5 });
d('dal_chawal', 'Dal chawal', 'dal rice', 'thali', 'v', 'plate', 375, { '@dal_tadka': 1, '@rice': 1.5 });
d('kadhi_chawal', 'Kadhi chawal', 'kadhi rice', 'thali', 'v', 'plate', 405, { '@kadhi_pakora': 1, '@rice': 1.5 });
d('chicken_thali', 'Chicken thali', 'non veg thali', 'thali', 'n', 'thali', 650, { '@chicken_curry': 1, '@roti': 2, '@rice': 1, '@salad': 1, '@raita': 1 });
d('fish_thali', 'Fish thali', 'fish meals', 'thali', 'n', 'thali', 700, { '@fish_curry': 1, '@fish_fry': 1, '@rice': 2, '@salad': 1 });

export default dishes;
