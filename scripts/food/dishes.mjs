// Standard meals (Indian first, then international), written as the raw ingredients in ONE serving.
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

/* ── Fruits ── (edible weight: peeled, seeded, pulp only) */
d('fruit_apple', 'Apple', 'seb', 'fruits', 'v', 'apple', 150, { apple: 150 }, [['1 katori slices', 110]]);
d('fruit_banana', 'Banana', 'kela', 'fruits', 'v', 'banana', 100, { banana: 100 }, [['small banana', 70], ['large banana', 130]]);
d('fruit_orange', 'Orange (santra)', 'santra kinnow', 'fruits', 'v', 'orange', 130, { orange: 130 });
d('fruit_mosambi', 'Mosambi (sweet lime)', 'mosumbi sweet lime', 'fruits', 'v', 'mosambi', 130, { mosambi: 130 });
d('fruit_guava', 'Guava (amrood)', 'amrud peru', 'fruits', 'v', 'guava', 150, { guava: 150 });
d('fruit_mango', 'Mango', 'aam alphonso kesar', 'fruits', 'v', 'mango', 200, { mango: 200 }, [['1 katori slices', 150]]);
d('fruit_papaya', 'Papaya', 'papita', 'fruits', 'v', 'katori', 140, { papaya: 140 });
d('fruit_watermelon', 'Watermelon (tarbooz)', 'tarbuj', 'fruits', 'v', 'katori', 150, { watermelon: 150 }, [['1 slice', 280]]);
d('fruit_muskmelon', 'Muskmelon (kharbooja)', 'kharbuja cantaloupe', 'fruits', 'v', 'katori', 150, { muskmelon: 150 });
d('fruit_pineapple', 'Pineapple', 'ananas', 'fruits', 'v', 'katori', 140, { pineapple: 140 });
d('fruit_pomegranate', 'Pomegranate (anar)', 'anaar', 'fruits', 'v', 'katori', 100, { pomegranate: 100 }, [['1 pomegranate', 170]]);
d('fruit_grapes', 'Grapes, green', 'angoor', 'fruits', 'v', 'katori', 100, { grapes: 100 });
d('fruit_grapes_black', 'Grapes, black', 'kale angoor', 'fruits', 'v', 'katori', 100, { grapes_black: 100 });
d('fruit_chikoo', 'Chikoo (sapota)', 'sapota chiku', 'fruits', 'v', 'chikoo', 90, { chikoo: 90 });
d('fruit_litchi', 'Litchi', 'lychee', 'fruits', 'v', 'litchi', 15, { litchi: 15 }, [['10 litchis', 150]]);
d('fruit_strawberry', 'Strawberries', 'strawberry', 'fruits', 'v', 'katori', 120, { strawberry: 120 });
d('fruit_pear', 'Pear (nashpati)', 'nashpati', 'fruits', 'v', 'pear', 160, { pear: 160 });
d('fruit_sitaphal', 'Custard apple (sitaphal)', 'sitafal sharifa', 'fruits', 'v', 'sitaphal', 100, { custard_apple: 100 });
d('fruit_jackfruit', 'Jackfruit (ripe bulbs)', 'kathal', 'fruits', 'v', 'katori', 150, { jackfruit: 150 });
d('fruit_kiwi', 'Kiwi', 'kiwifruit', 'fruits', 'v', 'kiwi', 75, { kiwi: 75 });
d('fruit_blueberries', 'Blueberries', '', 'fruits', 'v', 'katori', 100, { blueberries: 100 });
d('fruit_plum', 'Plum (aloo bukhara)', 'aloo bukhara', 'fruits', 'v', 'plum', 65, { plum: 65 });
d('fruit_peach', 'Peach (aadoo)', 'aadu', 'fruits', 'v', 'peach', 150, { peach: 150 });
d('fruit_cherries', 'Cherries', 'cherry', 'fruits', 'v', 'katori', 100, { cherries: 100 }, [['10 cherries', 70]]);
d('fruit_amla', 'Amla', 'awla gooseberry', 'fruits', 'v', 'amla', 30, { amla: 30 });
d('fruit_ber', 'Ber', 'bor jujube', 'fruits', 'v', 'katori', 100, { ber: 100 });
d('fruit_fig', 'Fig, fresh (anjeer)', 'anjir', 'fruits', 'v', 'fig', 50, { fig: 50 });
d('fruit_avocado', 'Avocado', 'butter fruit', 'fruits', 'v', 'half avocado', 70, { avocado: 70 });
d('fruit_nungu', 'Ice apple (tadgola / nungu)', 'tadgola nungu', 'fruits', 'v', 'piece', 40, { nungu: 40 });
d('fruit_star', 'Star fruit (kamrakh)', 'kamrakh', 'fruits', 'v', 'fruit', 90, { star_fruit: 90 });
d('fruit_phalsa', 'Phalsa', 'falsa', 'fruits', 'v', 'katori', 100, { phalsa: 100 });
d('fruit_chaat', 'Fruit chaat', 'fruit bowl fruit salad', 'fruits', 'v', 'katori', 170, { apple: 40, banana: 40, papaya: 40, guava: 30, pomegranate: 20 });

/* ── Dry fruits & nuts ── (a handful is about 25 g) */
d('dry_almonds', 'Almonds (badam)', 'badam', 'dryfruits', 'v', 'handful', 25, { almond: 25 }, [['piece', 1.2], ['soaked, 10', 12]]);
d('dry_cashews', 'Cashews (kaju)', 'kaju', 'dryfruits', 'v', 'handful', 25, { cashew: 25 }, [['piece', 1.5]]);
d('dry_walnuts', 'Walnuts (akhrot)', 'akhrot', 'dryfruits', 'v', 'handful', 25, { walnut: 25 }, [['walnut (2 halves)', 5]]);
d('dry_pistachios', 'Pistachios (pista)', 'pista', 'dryfruits', 'v', 'handful', 25, { pistachio: 25 });
d('dry_peanuts', 'Peanuts, roasted (moongphali)', 'groundnut moongfali shengdana', 'dryfruits', 'v', 'handful', 30, { peanuts: 30 });
d('dry_raisins', 'Raisins (kishmish)', 'kishmish', 'dryfruits', 'v', 'tbsp', 10, { raisins: 10 }, [['handful', 25]]);
d('dry_munakka', 'Black raisins (munakka)', 'munakka', 'dryfruits', 'v', 'munakka', 2, { munakka: 2 }, [['handful', 25]]);
d('dry_dates', 'Dates (khajoor)', 'khajur', 'dryfruits', 'v', 'date', 8, { dates: 8 });
d('dry_anjeer', 'Dried figs (anjeer)', 'anjir', 'dryfruits', 'v', 'anjeer', 10, { anjeer_dry: 10 });
d('dry_apricots', 'Dried apricots (khubani)', 'khurmani jardalu', 'dryfruits', 'v', 'apricot', 8, { apricot_dry: 8 });
d('dry_prunes', 'Prunes', 'dried plums', 'dryfruits', 'v', 'prune', 9.5, { prunes: 9.5 });
d('dry_makhana', 'Makhana, roasted', 'phool makhana fox nuts', 'dryfruits', 'v', 'katori', 20, { makhana: 15, ghee: 3 });
d('dry_chilgoza', 'Pine nuts (chilgoza)', 'chilgoza', 'dryfruits', 'v', 'tbsp', 9, { pine_nuts: 9 });
d('dry_coconut', 'Dry coconut (copra)', 'khopra gola', 'dryfruits', 'v', 'tbsp grated', 6, { coconut_dry: 6 });
d('dry_mix', 'Mixed dry fruits', 'trail mix dry fruit mix', 'dryfruits', 'v', 'handful', 30, { almond: 8, cashew: 6, walnut: 5, raisins: 6, pistachio: 5 });
d('dry_seed_mix', 'Seed mix (pumpkin, sunflower, flax, chia)', 'seeds', 'dryfruits', 'v', 'tbsp', 10, { pumpkin_seeds: 3, sunflower_seeds: 3, flaxseed: 2, chia: 2 });
d('dry_pumpkin_seeds', 'Pumpkin seeds', 'kaddu ke beej', 'dryfruits', 'v', 'tbsp', 9, { pumpkin_seeds: 9 });
d('dry_dates_stuffed', 'Dates stuffed with almonds', 'khajoor badam', 'dryfruits', 'v', 'date', 10, { dates: 8, almond: 2 });

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

/* ════════ More dishes ════════ */

/* ── Breakfast: more Indian ── */
d('ven_pongal', 'Ven pongal', 'khara pongal', 'breakfast', 'v', 'plate', 200, { rice: 40, moong_dal: 15, ghee: 10, cashew: 3 });
d('rava_idli', 'Rava idli', 'sooji idli', 'breakfast', 'v', 'piece', 50, { sooji: 18, curd: 10, oil: 1.5 });
d('ragi_dosa', 'Ragi dosa', 'nachni dosa finger millet', 'breakfast', 'v', 'dosa', 80, { ragi: 25, rice_flour: 5, oil: 4 });
d('neer_dosa', 'Neer dosa', '', 'breakfast', 'v', 'dosa', 60, { rice: 20, oil: 2 });
d('set_dosa', 'Set dosa (3)', 'sponge dosa', 'breakfast', 'v', 'plate', 180, { rice: 50, urad_dal: 12, oil: 6 });
d('puttu', 'Puttu', 'puttu kadala', 'breakfast', 'v', 'plate', 150, { rice_flour: 60, coconut: 15 });
d('idiyappam', 'Idiyappam', 'string hoppers nool puttu', 'breakfast', 'v', 'piece', 35, { rice_flour: 12 });
d('akki_roti', 'Akki roti', 'rice roti', 'breakfast', 'v', 'roti', 70, { rice_flour: 35, onion: 10, oil: 4 });
d('thalipeeth', 'Thalipeeth', 'bhajani', 'breakfast', 'v', 'piece', 80, { jowar: 15, bajra: 10, besan: 8, onion: 10, oil: 5 });
d('sabudana_vada', 'Sabudana vada', 'sago vada', 'breakfast', 'v', 'piece', 45, { sabudana: 15, potato: 15, peanuts: 4, oil: 6 });
d('methi_paratha', 'Methi paratha', 'fenugreek paratha', 'breakfast', 'v', 'paratha', 70, { atta: 40, methi_leaves: 10, ghee: 6 });
d('egg_paratha', 'Egg paratha', 'anda paratha', 'breakfast', 'e', 'paratha', 130, { atta: 45, egg: 50, ghee: 7 });
d('masala_oats', 'Masala oats', 'savoury oats', 'breakfast', 'v', 'bowl', 200, { oats: 40, onion: 15, tomato: 15, peas: 10, oil: 3 });
d('daliya_namkeen', 'Daliya (namkeen)', 'broken wheat khichdi dalia', 'breakfast', 'v', 'bowl', 200, { dalia: 45, moong_dal: 10, carrot: 10, peas: 10, ghee: 4 });
d('daliya_sweet', 'Daliya with milk (sweet)', 'meetha dalia porridge', 'breakfast', 'v', 'bowl', 250, { dalia: 40, toned_milk: 200, sugar: 10 });
d('ragi_malt', 'Ragi malt / porridge', 'ragi java ambli', 'breakfast', 'v', 'glass', 250, { ragi: 25, toned_milk: 200, jaggery: 10 });
d('bread_jam', 'Bread jam (2 slices)', 'toast jam', 'breakfast', 'v', 'plate', 70, { bread: 50, jam: 20 });
d('pb_toast', 'Peanut butter toast (2 slices)', 'pb bread', 'breakfast', 'v', 'plate', 82, { brown_bread: 56, peanut_butter: 26 });
d('poori_bhaji', 'Poori bhaji (4 puri + aloo)', 'puri sabzi aloo puri', 'breakfast', 'v', 'plate', 250, { '@puri': 4, '@jeera_aloo': 1 });

/* ── Breakfast: international ── */
d('pancakes', 'Pancakes with syrup (2)', 'hotcakes', 'breakfast', 'e', 'plate', 160, { maida: 50, toned_milk: 60, egg: 25, butter: 5, sugar: 5, maple_syrup: 20 });
d('waffle', 'Waffle (plain)', 'belgian waffle', 'breakfast', 'e', 'piece', 75, { maida: 30, toned_milk: 25, egg: 12, butter: 6, sugar: 4 });
d('french_toast', 'French toast (2 slices)', 'eggy bread', 'breakfast', 'e', 'plate', 130, { bread: 50, egg: 50, toned_milk: 30, butter: 6, sugar: 5 });
d('scrambled_eggs_toast', 'Scrambled eggs on toast (2 eggs)', 'eggs toast', 'breakfast', 'e', 'plate', 170, { egg: 100, butter: 7, toned_milk: 20, bread: 50 });
d('cheese_omelette', 'Cheese omelette (2 eggs)', 'omelet', 'breakfast', 'e', 'omelette', 140, { egg: 100, cheese: 20, butter: 5 });
d('egg_white_omelette', 'Egg white omelette (4 whites)', 'egg whites', 'breakfast', 'e', 'omelette', 150, { egg_white: 132, oil: 3, onion: 15, tomato: 10 });
d('avocado_toast', 'Avocado toast (2 slices)', 'avo toast', 'breakfast', 'v', 'plate', 120, { brown_bread: 56, avocado: 60, lemon_juice: 3, olive_oil: 3 });
d('english_breakfast', 'Full English breakfast', 'fry up', 'breakfast', 'n', 'plate', 420, { egg: 100, bacon: 30, sausage: 50, bread: 50, butter: 5, baked_beans: 100, mushroom: 40, tomato: 50, oil: 8 });
d('granola_yogurt', 'Greek yogurt with granola', 'yogurt bowl parfait', 'breakfast', 'v', 'bowl', 200, { greek_yogurt: 150, granola: 40, honey: 7 });
d('muesli_milk', 'Muesli with milk', 'cereal', 'breakfast', 'v', 'bowl', 245, { muesli: 45, toned_milk: 200 });
d('smoothie_bowl', 'Smoothie bowl', 'acai bowl', 'breakfast', 'v', 'bowl', 300, { banana: 100, blueberries: 50, greek_yogurt: 100, granola: 20, honey: 5 });
d('overnight_oats', 'Overnight oats', 'oats jar', 'breakfast', 'v', 'jar', 260, { oats: 50, toned_milk: 150, chia: 10, banana: 50, honey: 7 });

/* ── Breads: more ── */
d('cheese_naan', 'Cheese naan', '', 'breads', 'v', 'naan', 130, { maida: 55, curd: 8, oil: 3, mozzarella: 25, butter: 5 });
d('kerala_parotta', 'Kerala / Malabar parotta', 'porotta lachha', 'breads', 'v', 'parotta', 100, { maida: 55, oil: 12 });
d('ragi_roti', 'Ragi roti', 'nachni bhakri', 'breads', 'v', 'roti', 60, { ragi: 40 });
d('multigrain_roti', 'Multigrain roti', '', 'breads', 'v', 'roti', 45, { atta: 18, bajra: 4, jowar: 4, besan: 4 });
d('garlic_bread', 'Garlic bread (2 slices)', '', 'breads', 'v', 'plate', 70, { bread: 55, butter: 12, garlic: 3 });
d('cheese_garlic_bread', 'Cheese garlic bread (2 slices)', '', 'breads', 'v', 'plate', 90, { bread: 55, butter: 10, garlic: 3, mozzarella: 20 });
d('pita', 'Pita bread', 'pitta', 'breads', 'v', 'piece', 60, { maida: 38, oil: 1 });

/* ── Rice & noodles: more ── */
d('paneer_biryani', 'Paneer biryani', 'biriyani', 'rice', 'v', 'plate', 320, { rice: 80, paneer: 50, curd: 20, onion: 30, ghee: 12 });
d('prawn_biryani', 'Prawn biryani', 'jhinga biriyani', 'rice', 'n', 'plate', 330, { rice: 80, prawns: 90, curd: 20, onion: 30, oil: 12 });
d('chicken_pulao', 'Chicken pulao / yakhni pulao', 'murgh pulav', 'rice', 'n', 'plate', 300, { rice: 75, chicken_leg: 80, onion: 25, ghee: 10 });
d('puliyogare', 'Tamarind rice', 'puliyogare puliodarai imli chawal', 'rice', 'v', 'plate', 200, { rice: 60, peanuts: 8, oil: 10, jaggery: 3, chana_dal: 3 });
d('coconut_rice', 'Coconut rice', 'thengai sadam', 'rice', 'v', 'plate', 200, { rice: 60, coconut: 20, oil: 6, chana_dal: 3 });
d('tomato_rice', 'Tomato rice', 'thakkali sadam', 'rice', 'v', 'plate', 220, { rice: 60, tomato: 50, onion: 20, oil: 8 });
d('egg_fried_rice', 'Egg fried rice', 'chinese', 'rice', 'e', 'plate', 280, { rice: 70, egg: 50, oil: 12, cabbage: 15, carrot: 15, capsicum: 10 });
d('schezwan_rice', 'Schezwan fried rice', 'szechuan', 'rice', 'v', 'plate', 260, { rice: 70, oil: 15, cabbage: 20, carrot: 15, capsicum: 10, soy_sauce: 5 });
d('chicken_noodles', 'Chicken hakka noodles', 'chowmein', 'rice', 'n', 'plate', 280, { noodles: 70, chicken_breast: 60, oil: 14, cabbage: 20, carrot: 15, capsicum: 15, soy_sauce: 8 });
d('teriyaki_bowl', 'Teriyaki chicken rice bowl', 'japanese rice bowl', 'rice', 'n', 'bowl', 400, { rice: 75, chicken_thigh: 120, soy_sauce: 15, sugar: 8, oil: 8, broccoli: 40 });

/* ── Dal: more ── */
d('panchmel_dal', 'Panchmel dal', 'pachmel dal rajasthani', 'dal', 'v', 'katori', 150, { toor_dal: 10, chana_dal: 8, moong_dal: 7, urad_dal: 7, masoor_dal: 7, ghee: 6 });
d('dal_dhokli', 'Dal dhokli', 'varan phal', 'dal', 'v', 'plate', 250, { toor_dal: 30, atta: 30, oil: 6, jaggery: 5, peanuts: 5 });
d('usal', 'Usal (sprouts curry)', 'matki usal misal', 'dal', 'v', 'katori', 150, { moth: 35, onion: 20, tomato: 15, oil: 6 });
d('sprouts_moong_curry', 'Moong sprouts curry', 'sprouted moong', 'dal', 'v', 'katori', 150, { moong_whole: 35, onion: 20, tomato: 15, oil: 6 });

/* ── Sabzi & paneer: more ── */
d('paneer_tikka', 'Paneer tikka (6 pieces)', 'tandoori paneer', 'sabzi', 'v', 'plate', 180, { paneer: 120, curd: 30, capsicum: 20, onion: 20, oil: 6 });
d('paneer_tikka_masala', 'Paneer tikka masala', '', 'sabzi', 'v', 'katori', 180, { paneer: 80, onion: 30, tomato: 50, cream: 10, oil: 10, curd: 10 });
d('chilli_paneer', 'Chilli paneer (dry)', 'indo chinese paneer', 'sabzi', 'v', 'plate', 180, { paneer: 100, cornflour: 10, maida: 5, capsicum: 30, onion: 30, oil: 12, soy_sauce: 8 });
d('methi_malai_matar', 'Methi malai matar', '', 'sabzi', 'v', 'katori', 150, { peas: 50, methi_leaves: 20, cream: 15, onion: 20, oil: 7 });
d('bharwa_baingan', 'Bharwa baingan / baingan masala', 'stuffed brinjal ennai kathirikai', 'sabzi', 'v', 'katori', 150, { brinjal: 120, peanuts: 8, oil: 10, onion: 15 });
d('aloo_baingan', 'Aloo baingan', 'potato brinjal', 'sabzi', 'v', 'katori', 150, { brinjal: 70, potato: 60, oil: 8, onion: 15, tomato: 20 });
d('lauki_kofta', 'Lauki kofta curry', 'ghiya kofta', 'sabzi', 'v', 'katori', 180, { lauki: 80, besan: 20, oil: 14, onion: 20, tomato: 40, cream: 5 });
d('arbi_fry', 'Arbi fry', 'colocasia', 'sabzi', 'v', 'katori', 120, { arbi: 120, oil: 10 });
d('kathal_sabzi', 'Kathal sabzi', 'raw jackfruit curry', 'sabzi', 'v', 'katori', 150, { raw_jackfruit: 130, oil: 10, onion: 20, tomato: 20 });
d('tofu_bhurji', 'Tofu bhurji', 'scrambled tofu', 'sabzi', 'v', 'katori', 140, { tofu: 100, oil: 6, onion: 20, tomato: 15, capsicum: 10 });
d('gobi_manchurian', 'Gobi manchurian (dry)', 'cauliflower manchurian', 'sabzi', 'v', 'plate', 200, { cauliflower: 120, maida: 20, cornflour: 10, oil: 15, soy_sauce: 8, onion: 15, capsicum: 10 });
d('veg_manchurian', 'Veg manchurian (gravy)', '', 'sabzi', 'v', 'katori', 180, { cabbage: 50, carrot: 30, maida: 20, cornflour: 10, oil: 14, soy_sauce: 8 });
d('chilli_potato', 'Honey chilli potato', 'chilli potato', 'sabzi', 'v', 'plate', 180, { potato: 140, cornflour: 10, oil: 15, capsicum: 20, onion: 20, soy_sauce: 6, honey: 5 });
d('undhiyu', 'Undhiyu', 'gujarati mixed veg', 'sabzi', 'v', 'katori', 180, { potato: 30, sweet_potato: 30, suran: 25, brinjal: 30, french_beans: 25, besan: 15, methi_leaves: 10, oil: 15, coconut: 5 });
d('kootu', 'Kootu', 'lauki kootu', 'sabzi', 'v', 'katori', 150, { moong_dal: 15, lauki: 80, coconut: 10, oil: 3 });
d('palak_corn', 'Palak corn', 'spinach corn', 'sabzi', 'v', 'katori', 150, { spinach: 100, sweet_corn: 40, cream: 10, oil: 6, onion: 15 });
d('stir_fry_veg', 'Stir-fried vegetables', 'sauteed veggies', 'sabzi', 'v', 'plate', 200, { broccoli: 50, capsicum: 40, carrot: 30, zucchini: 40, mushroom: 30, oil: 8, soy_sauce: 8 });
d('tofu_stir_fry', 'Tofu stir-fry', '', 'sabzi', 'v', 'plate', 250, { tofu: 120, broccoli: 50, capsicum: 30, oil: 10, soy_sauce: 10 });

/* ── Non-veg: more ── */
d('chicken_korma', 'Chicken korma', 'murgh korma', 'nonveg', 'n', 'katori', 200, { chicken_leg: 110, curd: 30, onion: 40, cashew: 8, ghee: 12 });
d('chicken_chettinad', 'Chicken chettinad', '', 'nonveg', 'n', 'katori', 200, { chicken_leg: 110, onion: 40, tomato: 30, coconut: 15, oil: 12 });
d('chicken_tikka_masala', 'Chicken tikka masala', '', 'nonveg', 'n', 'katori', 200, { chicken_breast: 100, onion: 30, tomato: 50, cream: 15, butter: 5, oil: 8, curd: 15 });
d('malai_tikka', 'Chicken malai tikka (6 pieces)', 'reshmi kebab', 'nonveg', 'n', 'plate', 130, { chicken_breast: 150, cream: 15, cheese: 10, curd: 15, oil: 5 });
d('chicken_lollipop', 'Chicken lollipop (4)', '', 'nonveg', 'n', 'plate', 160, { chicken_leg: 140, maida: 15, cornflour: 10, oil: 18 });
d('chicken_keema', 'Chicken keema', 'chicken mince', 'nonveg', 'n', 'katori', 150, { chicken_breast: 110, peas: 30, onion: 30, tomato: 30, oil: 10 });
d('chicken_soup', 'Chicken soup (clear)', 'chicken broth', 'nonveg', 'n', 'bowl', 250, { chicken_breast: 50, carrot: 15, onion: 10, cornflour: 5, butter: 3 });
d('mutton_seekh', 'Mutton seekh kebab (2)', 'lamb kebab', 'nonveg', 'n', 'plate', 100, { mutton: 120, onion: 10, oil: 4 });
d('nihari', 'Nihari', 'mutton nihari', 'nonveg', 'n', 'katori', 220, { mutton: 120, atta: 8, ghee: 15, onion: 25 });
d('haleem', 'Haleem', 'mutton haleem', 'nonveg', 'n', 'katori', 250, { mutton: 70, dalia: 30, chana_dal: 10, urad_dal: 5, ghee: 15, onion: 20 });
d('beef_fry', 'Kerala beef fry', 'beef ularthiyathu', 'nonveg', 'n', 'plate', 150, { beef: 150, coconut: 15, coconut_oil: 12, onion: 30 });
d('pork_vindaloo', 'Pork vindaloo', '', 'nonveg', 'n', 'katori', 200, { pork: 120, onion: 30, oil: 12, tomato: 20 });
d('fish_tikka', 'Fish tikka / tandoori fish', '', 'nonveg', 'n', 'plate', 150, { basa: 180, curd: 20, oil: 6 });
d('prawn_fry', 'Prawn fry', 'jhinga fry', 'nonveg', 'n', 'plate', 120, { prawns: 140, oil: 10, rice_flour: 5 });
d('goan_fish_curry', 'Goan fish curry', 'coconut fish curry', 'nonveg', 'n', 'katori', 200, { mackerel: 100, coconut_milk: 50, onion: 20, oil: 6 });
d('egg_roll', 'Egg roll (Kolkata style)', 'anda roll', 'nonveg', 'e', 'roll', 200, { maida: 55, egg: 50, oil: 10, onion: 20 });
d('boiled_eggs_2', 'Boiled eggs (2) + 2 whites', 'egg whites', 'nonveg', 'e', 'plate', 166, { egg: 100, egg_white: 66 });

/* ── Snacks & street food: more ── */
d('chole_kulche', 'Chole kulche (2 kulche)', 'kulcha chole', 'snacks', 'v', 'plate', 350, { '@chole': 1, '@kulcha': 2 });
d('paneer_roll', 'Paneer kathi roll', 'paneer frankie wrap', 'snacks', 'v', 'roll', 200, { maida: 55, paneer: 60, oil: 10, onion: 20, capsicum: 15 });
d('khandvi', 'Khandvi', 'suralichi vadi', 'snacks', 'v', 'plate', 100, { besan: 25, curd: 30, oil: 5, coconut: 3 });
d('handvo', 'Handvo', '', 'snacks', 'v', 'piece', 100, { rice: 15, toor_dal: 10, chana_dal: 5, lauki: 20, curd: 10, oil: 6, til: 2 });
d('murukku', 'Murukku / chakli (4)', 'chakli', 'snacks', 'v', 'plate', 30, { rice_flour: 18, urad_dal: 3, oil: 8 });
d('mathri', 'Mathri (2)', 'mathi', 'snacks', 'v', 'plate', 30, { maida: 18, ghee: 3, oil: 6 });
d('khakhra', 'Khakhra', '', 'snacks', 'v', 'piece', 20, { atta: 18, oil: 1 });
d('popcorn', 'Popcorn (salted)', 'pop corn', 'snacks', 'v', 'bowl', 30, { makki_atta: 28, oil: 2 });
d('paneer_pakora', 'Paneer pakora (4)', 'paneer bhajji', 'snacks', 'v', 'plate', 100, { paneer: 60, besan: 20, oil: 12 });
d('batata_vada', 'Batata vada / aloo bonda', 'aloo bonda', 'snacks', 'v', 'piece', 60, { potato: 40, besan: 12, oil: 7 });
d('egg_puff', 'Egg puff', '', 'snacks', 'e', 'piece', 100, { maida: 35, butter: 15, egg: 25, onion: 10 });
d('chicken_puff', 'Chicken puff', '', 'snacks', 'n', 'piece', 100, { maida: 35, butter: 15, chicken_breast: 30, onion: 10 });
d('veg_cutlet', 'Veg cutlet', '', 'snacks', 'v', 'piece', 60, { potato: 35, carrot: 8, peas: 8, bread: 8, oil: 6 });
d('chicken_nuggets', 'Chicken nuggets (6)', '', 'snacks', 'n', 'plate', 100, { chicken_breast: 60, maida: 12, cornflour: 5, oil: 12 });
d('masala_corn', 'Masala corn / corn chaat', 'butter corn cup', 'snacks', 'v', 'cup', 100, { sweet_corn: 100, butter: 5, lemon_juice: 3 });
d('ragda_pattice', 'Ragda pattice', 'ragda patties', 'snacks', 'v', 'plate', 250, { dry_peas: 40, potato: 80, oil: 8, onion: 15, '@imli_chutney': 1 });
d('aloo_chaat', 'Aloo chaat', '', 'snacks', 'v', 'plate', 150, { potato: 130, oil: 8, lemon_juice: 5 });
d('dahi_vada', 'Dahi vada / dahi bhalla (2)', 'dahi bhalle', 'snacks', 'v', 'plate', 180, { urad_dal: 30, oil: 8, curd: 100, sugar: 5 });
d('fried_momos', 'Fried chicken momos (6)', 'momo', 'snacks', 'n', 'plate', 170, { maida: 60, chicken_breast: 60, onion: 15, oil: 15 });
d('spring_roll', 'Veg spring roll (2)', '', 'snacks', 'v', 'plate', 120, { maida: 30, cabbage: 40, carrot: 20, oil: 12 });
d('onion_rings', 'Onion rings', '', 'snacks', 'v', 'plate', 100, { onion: 70, maida: 20, oil: 18 });
d('nachos_cheese', 'Nachos with cheese', 'nachos', 'snacks', 'v', 'plate', 150, { nachos: 60, cheese: 40, tomato: 20, sour_cream: 15 });

/* ── Sweets & desserts: more ── */
d('peda', 'Peda', 'pedha', 'sweets', 'v', 'piece', 25, { khoa: 15, sugar: 8 });
d('sandesh', 'Sandesh', '', 'sweets', 'v', 'piece', 30, { paneer: 20, sugar: 8 });
d('soan_papdi', 'Soan papdi', 'son papdi', 'sweets', 'v', 'piece', 25, { besan: 7, maida: 5, ghee: 6, sugar: 9 });
d('coconut_ladoo', 'Coconut ladoo', 'nariyal ladoo', 'sweets', 'v', 'piece', 25, { coconut_dry: 10, sugar: 8, khoa: 4 });
d('rava_ladoo', 'Rava ladoo', 'sooji ladoo', 'sweets', 'v', 'piece', 35, { sooji: 15, ghee: 6, sugar: 12, coconut_dry: 2 });
d('dryfruit_ladoo', 'Dry fruit ladoo', 'dates ladoo', 'sweets', 'v', 'piece', 30, { dates: 15, almond: 5, cashew: 5, ghee: 2 });
d('malpua', 'Malpua', '', 'sweets', 'v', 'piece', 60, { maida: 20, khoa: 5, toned_milk: 15, sugar: 15, ghee: 8 });
d('phirni', 'Phirni', 'firni', 'sweets', 'v', 'katori', 120, { rice: 10, fullcream_milk: 100, sugar: 12 });
d('moong_dal_halwa', 'Moong dal halwa', '', 'sweets', 'v', 'katori', 100, { moong_dal: 25, ghee: 20, sugar: 22, khoa: 10 });
d('kalakand', 'Kalakand', 'milk cake', 'sweets', 'v', 'piece', 30, { paneer: 15, khoa: 5, sugar: 8 });
d('imarti', 'Imarti', 'jangiri', 'sweets', 'v', 'piece', 40, { urad_dal: 10, sugar: 20, oil: 7 });
d('ghevar', 'Ghevar', '', 'sweets', 'v', 'piece', 70, { maida: 25, ghee: 15, sugar: 25 });
d('fruit_custard', 'Fruit custard', 'custard', 'sweets', 'v', 'katori', 180, { toned_milk: 130, sugar: 12, cornflour: 6, apple: 20, banana: 20, grapes: 15 });
d('ice_cream_scoop', 'Ice cream (1 scoop)', 'vanilla ice cream', 'sweets', 'v', 'scoop', 65, { ice_cream: 65 });
d('chocolate_cake', 'Chocolate cake (1 slice)', 'pastry', 'sweets', 'e', 'slice', 80, { maida: 22, sugar: 20, butter: 12, egg: 12, cocoa_powder: 5, toned_milk: 10 });
d('brownie', 'Chocolate brownie', '', 'sweets', 'e', 'piece', 60, { maida: 12, sugar: 20, butter: 12, egg: 10, dark_chocolate: 10, cocoa_powder: 3 });
d('cheesecake', 'Cheesecake (1 slice)', '', 'sweets', 'e', 'slice', 100, { cream_cheese: 45, sugar: 15, egg: 12, biscuit: 15, butter: 7, cream: 8 });
d('donut', 'Glazed donut', 'doughnut', 'sweets', 'e', 'piece', 60, { maida: 25, sugar: 10, oil: 10, toned_milk: 5, egg: 3 });
d('choc_chip_cookie', 'Chocolate chip cookie', 'cookies', 'sweets', 'v', 'cookie', 20, { maida: 7, butter: 4, sugar: 6, dark_chocolate: 3 });
d('muffin', 'Blueberry / plain muffin', 'cupcake', 'sweets', 'e', 'piece', 100, { maida: 35, sugar: 20, oil: 10, egg: 12, toned_milk: 15, blueberries: 10 });
d('croissant', 'Croissant (butter)', '', 'sweets', 'v', 'piece', 60, { maida: 28, butter: 13, sugar: 3, toned_milk: 8 });

/* ── Drinks: more ── */
d('green_tea', 'Green tea / black tea (no sugar)', 'kahwa', 'drinks', 'v', 'cup', 200, { tea_leaves: 200 });
d('black_coffee', 'Black coffee / Americano (no sugar)', 'espresso', 'drinks', 'v', 'cup', 200, { tea_leaves: 200 });
d('cappuccino', 'Cappuccino / latte (café, whole milk)', 'cafe latte flat white', 'drinks', 'v', 'cup', 250, { fullcream_milk: 180 }, [['1 large', 350]]);
d('filter_coffee', 'Filter coffee (with sugar)', 'south indian kaapi', 'drinks', 'v', 'tumbler', 150, { toned_milk: 100, sugar: 10 });
d('hot_chocolate', 'Hot chocolate', 'cocoa', 'drinks', 'v', 'mug', 250, { fullcream_milk: 220, cocoa_powder: 10, sugar: 15 });
d('choc_milkshake', 'Chocolate milkshake', 'shake', 'drinks', 'v', 'glass', 300, { fullcream_milk: 250, ice_cream: 30, cocoa_powder: 6, sugar: 15 });
d('mango_lassi', 'Mango lassi', '', 'drinks', 'v', 'glass', 250, { curd: 150, mango: 70, sugar: 15 });
d('thandai', 'Thandai', '', 'drinks', 'v', 'glass', 250, { fullcream_milk: 200, almond: 10, sugar: 20 });
d('coconut_water_glass', 'Coconut water (1 nariyal)', 'nariyal pani tender coconut', 'drinks', 'v', 'glass', 250, { coconut_water: 250 });
d('sugarcane_juice_glass', 'Sugarcane juice', 'ganne ka ras', 'drinks', 'v', 'glass', 250, { sugarcane_juice: 250 });
d('watermelon_juice', 'Watermelon juice', 'tarbooz juice', 'drinks', 'v', 'glass', 250, { watermelon: 300 });
d('packaged_juice', 'Packaged fruit juice', 'real tropicana frooti', 'drinks', 'v', 'glass', 200, { fruit_juice_pack: 200 });
d('pb_banana_smoothie', 'Peanut butter banana smoothie', 'shake', 'drinks', 'v', 'glass', 370, { banana: 100, peanut_butter: 16, toned_milk: 250 });
d('cola_can', 'Cola / soft drink (1 can)', 'coke pepsi thums up sprite', 'drinks', 'v', 'can', 300, { cola: 300 });
d('beer_bottle', 'Beer (1 pint / bottle)', 'beer', 'drinks', 'v', 'bottle', 330, { beer: 330 }, [['1 pitcher pour', 500]]);
d('wine_glass', 'Wine (1 glass)', 'red white wine', 'drinks', 'v', 'glass', 150, { wine: 150 });
d('spirits_peg', 'Whisky / rum / vodka (1 large peg, 60 ml)', 'daru drink peg', 'drinks', 'v', 'large peg', 60, { spirits: 60 }, [['1 small peg (30 ml)', 30]]);

/* ── Sides: more ── */
d('hummus', 'Hummus', '', 'sides', 'v', 'katori', 100, { kabuli_chana: 24, tahini: 12, olive_oil: 6, lemon_juice: 5 }, [['1 tbsp', 15]]);
d('guacamole', 'Guacamole', '', 'sides', 'v', 'katori', 100, { avocado: 85, onion: 8, tomato: 8, lemon_juice: 4 }, [['1 tbsp', 15]]);
d('coleslaw', 'Coleslaw', '', 'sides', 'v', 'katori', 100, { cabbage: 60, carrot: 15, mayonnaise: 15 });
d('mashed_potato', 'Mashed potatoes', 'mash', 'sides', 'v', 'katori', 150, { potato: 130, butter: 10, toned_milk: 25 });
d('falafel', 'Falafel (4)', '', 'sides', 'v', 'plate', 100, { kabuli_chana: 40, oil: 12, onion: 10, coriander: 3 });
d('tomato_soup', 'Tomato soup', 'cream of tomato', 'sides', 'v', 'bowl', 250, { tomato: 200, butter: 5, cream: 10, sugar: 5, cornflour: 4 });
d('sweet_corn_soup', 'Sweet corn soup (veg)', '', 'sides', 'v', 'bowl', 250, { sweet_corn: 50, cornflour: 8, carrot: 10, butter: 3 });
d('hot_sour_soup', 'Hot & sour / manchow soup (veg)', 'manchow', 'sides', 'v', 'bowl', 250, { cabbage: 20, carrot: 15, cornflour: 8, soy_sauce: 8, oil: 4, mushroom: 10 });
d('mushroom_soup', 'Cream of mushroom soup', '', 'sides', 'v', 'bowl', 250, { mushroom: 70, butter: 8, maida: 6, toned_milk: 100, cream: 15 });

/* ── International mains ── */
d('pizza_pepperoni', 'Pepperoni pizza (1 slice, medium)', 'pizza slice', 'world', 'n', 'slice', 110, { maida: 40, mozzarella: 25, tomato: 15, oil: 4, sausage: 15 }, [['1 whole medium (8 slices)', 880]]);
d('pizza_chicken', 'Chicken tikka pizza (1 slice, medium)', 'pizza slice', 'world', 'n', 'slice', 115, { maida: 40, mozzarella: 25, chicken_breast: 20, capsicum: 8, onion: 8, oil: 4 }, [['1 whole medium (8 slices)', 920]]);
d('pizza_veg', 'Farmhouse / veggie pizza (1 slice, medium)', 'pizza slice', 'world', 'v', 'slice', 115, { maida: 40, mozzarella: 25, capsicum: 10, onion: 10, mushroom: 10, tomato: 15, oil: 4 }, [['1 whole medium (8 slices)', 920]]);
d('pizza_cheese_burst', 'Cheese burst pizza (1 slice, medium)', 'pizza slice', 'world', 'v', 'slice', 120, { maida: 40, mozzarella: 40, cheese: 10, oil: 5 }, [['1 whole medium (8 slices)', 960]]);
d('chicken_burger', 'Chicken burger (crispy)', 'zinger mcchicken', 'world', 'n', 'burger', 200, { burger_bun: 55, chicken_breast: 80, maida: 10, oil: 12, mayonnaise: 10, lettuce: 15, tomato: 15 });
d('cheeseburger', 'Cheeseburger (beef)', 'hamburger', 'world', 'n', 'burger', 220, { burger_bun: 55, beef_mince: 100, cheese: 20, lettuce: 15, tomato: 15, ketchup: 10 });
d('paneer_burger', 'Paneer burger', '', 'world', 'v', 'burger', 190, { burger_bun: 55, paneer: 70, maida: 8, oil: 10, mayonnaise: 10, lettuce: 10 });
d('hot_dog', 'Hot dog', 'sausage bun', 'world', 'n', 'piece', 120, { burger_bun: 50, sausage: 60, ketchup: 10 });
d('club_sandwich', 'Club sandwich', '', 'world', 'n', 'plate', 250, { bread: 75, chicken_breast: 50, egg: 50, cheese: 20, mayonnaise: 15, lettuce: 15, tomato: 20 });
d('chicken_mayo_sandwich', 'Chicken mayo sandwich', '', 'world', 'n', 'sandwich', 150, { bread: 50, chicken_breast: 50, mayonnaise: 15, lettuce: 10 });
d('paneer_sandwich', 'Paneer sandwich (grilled)', '', 'world', 'v', 'sandwich', 140, { bread: 50, paneer: 50, butter: 8, capsicum: 10, onion: 10 });
d('egg_sandwich', 'Egg sandwich', 'egg mayo', 'world', 'e', 'sandwich', 120, { bread: 50, egg: 50, mayonnaise: 10, butter: 5 });
d('pb_sandwich', 'Peanut butter sandwich', 'pbj', 'world', 'v', 'sandwich', 82, { bread: 50, peanut_butter: 32 });
d('sub_chicken', 'Chicken sub (6-inch)', 'subway', 'world', 'n', 'sub', 230, { bread: 75, chicken_breast: 70, lettuce: 20, tomato: 20, cucumber: 15, onion: 10, mayonnaise: 10, cheese: 14 });
d('sub_veg', 'Veggie sub (6-inch)', 'subway veg delite', 'world', 'v', 'sub', 200, { bread: 75, lettuce: 25, tomato: 25, cucumber: 20, onion: 15, capsicum: 15, mayonnaise: 10, cheese: 14 });
d('chicken_wrap', 'Chicken wrap', 'tortilla wrap', 'world', 'n', 'wrap', 230, { tortilla: 65, chicken_breast: 80, lettuce: 15, tomato: 15, mayonnaise: 12, oil: 5 });
d('falafel_wrap', 'Falafel wrap', '', 'world', 'v', 'wrap', 250, { tortilla: 65, kabuli_chana: 40, oil: 12, tahini: 10, lettuce: 15, tomato: 15, onion: 10 });
d('shawarma', 'Chicken shawarma roll', 'shawarma', 'world', 'n', 'roll', 250, { maida: 50, chicken_thigh: 90, mayonnaise: 20, oil: 5, onion: 15, cabbage: 15 });
d('pasta_white', 'White sauce pasta', 'alfredo pasta', 'world', 'v', 'plate', 300, { pasta: 80, butter: 10, maida: 8, toned_milk: 120, cheese: 15, capsicum: 15, sweet_corn: 15 });
d('pasta_pesto', 'Pesto pasta', '', 'world', 'v', 'plate', 250, { pasta: 80, olive_oil: 15, parmesan: 10, pine_nuts: 5 });
d('spaghetti_bolognese', 'Spaghetti bolognese', 'meat sauce pasta', 'world', 'n', 'plate', 350, { pasta: 85, beef_mince: 90, tomato: 100, onion: 25, olive_oil: 7, parmesan: 5 });
d('mac_cheese', 'Mac and cheese', 'macaroni cheese', 'world', 'v', 'plate', 250, { pasta: 75, cheese: 40, toned_milk: 100, butter: 10, maida: 5 });
d('chicken_alfredo', 'Chicken alfredo pasta', '', 'world', 'n', 'plate', 320, { pasta: 80, chicken_breast: 70, cream: 40, butter: 10, parmesan: 15 });
d('veg_lasagna', 'Veg lasagna', 'lasagne', 'world', 'v', 'piece', 300, { pasta: 60, mozzarella: 40, tomato: 80, toned_milk: 60, butter: 8, maida: 6, spinach: 30 });
d('sushi_salmon', 'Salmon sushi roll (6 pieces)', 'maki', 'world', 'n', 'plate', 180, { rice: 60, salmon: 50, cucumber: 15, sugar: 5 });
d('sushi_veg', 'Veg sushi roll (6 pieces)', 'avocado cucumber maki', 'world', 'v', 'plate', 170, { rice: 60, avocado: 30, cucumber: 25, sugar: 5 });
d('ramen', 'Chicken ramen', 'noodle soup', 'world', 'n', 'bowl', 500, { noodles: 80, chicken_breast: 60, egg: 50, soy_sauce: 15, oil: 5, spinach: 20 });
d('pad_thai', 'Pad thai (chicken)', 'thai noodles', 'world', 'n', 'plate', 350, { rice_noodles: 80, chicken_breast: 60, egg: 25, peanuts: 15, oil: 15, sugar: 8, soy_sauce: 10 });
d('thai_green_curry', 'Thai green curry (chicken)', 'thai curry', 'world', 'n', 'katori', 250, { chicken_breast: 90, coconut_milk: 80, french_beans: 20, brinjal: 20, oil: 5, sugar: 3 });
d('thai_red_curry_veg', 'Thai red curry (veg)', 'thai curry', 'world', 'v', 'katori', 250, { coconut_milk: 80, capsicum: 25, baby_corn: 25, brinjal: 25, mushroom: 20, oil: 5, sugar: 3 });
d('kung_pao', 'Kung pao chicken', 'chinese chicken', 'world', 'n', 'plate', 200, { chicken_breast: 110, peanuts: 15, capsicum: 25, oil: 12, soy_sauce: 12, sugar: 5, cornflour: 5 });
d('burrito', 'Chicken burrito', 'mexican wrap', 'world', 'n', 'burrito', 350, { tortilla: 90, rice: 40, chicken_breast: 80, rajma: 25, cheese: 20, sour_cream: 20, tomato: 20, lettuce: 10 });
d('burrito_bowl', 'Veg burrito bowl', 'mexican bowl', 'world', 'v', 'bowl', 400, { rice: 60, rajma: 35, sweet_corn: 40, tomato: 40, onion: 15, cheese: 20, sour_cream: 20, avocado: 40, lettuce: 15 });
d('tacos', 'Chicken tacos (2)', 'taco', 'world', 'n', 'plate', 200, { tortilla: 50, chicken_breast: 70, cheese: 15, lettuce: 15, tomato: 20, sour_cream: 15, oil: 4 });
d('quesadilla', 'Chicken quesadilla', '', 'world', 'n', 'plate', 200, { tortilla: 65, cheese: 50, chicken_breast: 50, oil: 4, capsicum: 10 });
d('hummus_pita', 'Hummus with pita', '', 'world', 'v', 'plate', 160, { '@hummus': 1, '@pita': 1 });
d('greek_salad', 'Greek salad', '', 'world', 'v', 'bowl', 250, { cucumber: 80, tomato: 80, onion: 20, olives: 20, feta: 30, olive_oil: 10 });
d('caesar_salad', 'Chicken caesar salad', '', 'world', 'n', 'bowl', 300, { lettuce: 100, chicken_breast: 90, parmesan: 10, bread: 15, mayonnaise: 20, olive_oil: 5 });
d('chicken_salad', 'Grilled chicken salad', '', 'world', 'n', 'bowl', 300, { chicken_breast: 120, lettuce: 80, cucumber: 40, tomato: 40, olive_oil: 10 });
d('tuna_salad', 'Tuna salad', '', 'world', 'n', 'bowl', 270, { tuna_canned: 100, lettuce: 60, cucumber: 40, tomato: 40, onion: 15, mayonnaise: 15 });
d('quinoa_salad', 'Quinoa salad', 'quinoa bowl', 'world', 'v', 'bowl', 250, { quinoa: 50, cucumber: 40, tomato: 40, kabuli_chana: 15, olive_oil: 8, lemon_juice: 5, feta: 15 });
d('grilled_salmon', 'Grilled salmon', 'salmon fillet', 'world', 'n', 'piece', 150, { salmon: 180, olive_oil: 5, lemon_juice: 5 });
d('steak', 'Grilled steak (beef, ~200 g cooked)', 'sirloin ribeye', 'world', 'n', 'steak', 190, { beef: 250, butter: 8 });
d('roast_chicken_veg', 'Roast chicken with vegetables', '', 'world', 'n', 'plate', 350, { chicken_leg: 180, potato: 100, carrot: 50, broccoli: 50, olive_oil: 10 });
d('fried_chicken', 'Fried chicken (2 pieces)', 'kfc', 'world', 'n', 'plate', 220, { chicken_leg: 200, maida: 20, oil: 18 });
d('chicken_wings', 'BBQ chicken wings (6)', 'wings', 'world', 'n', 'plate', 180, { chicken_leg: 200, oil: 10, honey: 10, ketchup: 15 });
d('fish_and_chips', 'Fish and chips', '', 'world', 'n', 'plate', 330, { basa: 150, maida: 25, oil: 15, '@fries': 1 });
d('couscous_veg', 'Vegetable couscous', '', 'world', 'v', 'plate', 250, { couscous: 60, zucchini: 40, capsicum: 30, kabuli_chana: 15, olive_oil: 8 });

/* ── More combos ── */
d('dal_baati', 'Dal baati (3 baati + dal)', 'rajasthani dal bati', 'thali', 'v', 'plate', 375, { '@baati': 3, '@panchmel_dal': 1 });
d('biryani_raita', 'Chicken biryani + raita', 'biryani combo', 'thali', 'n', 'plate', 450, { '@chicken_biryani': 1, '@raita': 1 });
d('paneer_thali', 'Paneer thali', 'veg thali', 'thali', 'v', 'thali', 720, { '@paneer_butter_masala': 1, '@dal_makhani': 1, '@butter_naan': 1, '@roti': 1, '@jeera_rice': 1, '@salad': 1 });
d('maharashtrian_thali', 'Maharashtrian thali', 'marathi jevan', 'thali', 'v', 'thali', 700, { '@jowar_bhakri': 2, '@usal': 1, '@dal_tadka': 1, '@rice': 1, '@salad': 1, '@pickle': 1 });
d('burger_meal', 'Burger meal (burger + fries + cola)', 'combo', 'thali', 'n', 'meal', 600, { '@chicken_burger': 1, '@fries': 1, '@cola_can': 1 });

export default dishes;
