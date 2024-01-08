// Test stuff

function objectsAreEqual(obj1, obj2) {
  // Get the keys of both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Check if the number of properties is the same
  if (keys1.length !== keys2.length) {
    return false;
  }

  // Check each property value
  for (let key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    // Check if the property values are objects
    // If they are, recursively call the function
    const areObjects = isObject(val1) && isObject(val2);
    if ((areObjects && !objectsAreEqual(val1, val2)) || (!areObjects && val1 !== val2)) {
      return false;
    }
  }

  return true;
}

function isObject(object) {
  return object != null && typeof object === "object";
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assert_match(str, expected_result) {
  const result = match_field(str);
  assert(
    objectsAreEqual(result, expected_result),
    "match_field(" + str + ")=" + JSON.stringify(result)
  );
}

function get_date() {
  const d = new Date();
  return parseInt(d.getTime() / (1000 * 60 * 60 * 24)); // milliseconds / (milliseconds * seconds * minutes * hours)
}

function hash_str(s) {
  var hash = 0,
    i,
    chr;
  if (s.length === 0) return hash;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isInteger(str) {
  return /^-?\d+$/.test(str);
}

assert(isInteger("-4"));
assert(isInteger("10323"));
assert(!isInteger("10323.4"));

function match_field(str) {
  // TODO remove
  // // remove any whitespace from str
  // str = str.replace(/\s/g, "");
  // split str on "=" character
  const split_str = str.split("=");

  // raise an error if split_str does not have exactly 2 items
  assert(split_str.length == 2, "match_field: split_str.length != 2");

  var symbol_id = "";

  const symbols = split_str[0].split(",");
  for (let i = 0; i < symbols.length; i++) {
    var symbol = symbols[i];
    if (symbol.includes(".")) {
      assert(i == 0, "if symbol contains '.', there should only be one element");
      const split = symbol.split(".");
      assert(split.length == 2, "There should only be one '.' in symbol");
      symbols[i] = split[0];
      symbol_id = split[1];
    }
  }
  const raw_values = split_str[1].split(",");
  const out_values = [];

  for (let i = 0; i < raw_values.length; i++) {
    var raw_val = raw_values[i];

    // if raw_val string does not contain ":", continue
    if (!raw_val.includes(":")) {
      out_values.push(raw_val);
      continue;
    }
    var step = 1;
    if (raw_val.includes(";")) {
      const colon_split = raw_val.split(";");
      assert(colon_split.length == 2, "match_field: colon_split.length != 2");
      raw_val = colon_split[0];

      step = parseInt(colon_split[1]);
    }

    const vals = raw_val.split(":");
    assert(vals.length == 2, "match_field: vals.length != 2");
    const start = vals[0];
    const end = vals[1];

    if (isInteger(start)) {
      assert(isInteger(end), `!isInteger(${end})`);
      const start_int = parseInt(start);
      const end_int = parseInt(end);
      assert(start_int < end_int, "start_int >= end_int");
      const int_range = [];
      for (let int_val = start_int; int_val <= end_int; int_val += step) {
        // cast int_val to string
        int_range.push(int_val.toString());
      }
      out_values.push(...int_range);
    } else {
      assert(!isInteger(end), `isInteger(${end})`);
      assert(start.length == 1, "start.length != 1");
      assert(end.length == 1, "end.length != 1");
      // check that character code for `start` is less than for `end`
      const start_char_code = start.charCodeAt(0);
      const end_char_code = end.charCodeAt(0);
      assert(start_char_code < end_char_code, "start_char_code >= end_char_code");
      // create an array containing all characters in the range from start to end,
      //     inclusive
      const char_range = [];
      for (let char_i = start_char_code; char_i <= end_char_code; char_i++) {
        char_range.push(String.fromCharCode(char_i));
      }
      out_values.push(...char_range);
    }
  }
  if (symbol_id) {
    return { symbols: symbols, values: out_values, symbol_id: symbol_id };
  }
  return { symbols: symbols, values: out_values };
}

// match_field unit tests
assert_match("x=1,2", { symbols: ["x"], values: ["1", "2"] });
assert_match("x,y=3:5", { symbols: ["x", "y"], values: ["3", "4", "5"] });
assert_match("x,y=3:5;2", { symbols: ["x", "y"], values: ["3", "5"] });
assert_match("1,2=f:h", { symbols: ["1", "2"], values: ["f", "g", "h"] });
assert_match("1,2=1,3:5,f:h", { symbols: ["1", "2"], values: ["1", "3", "4", "5", "f", "g", "h"] });
assert_match("x=big deal,small potatoes", {
  symbols: ["x"],
  values: ["big deal", "small potatoes"],
});
assert_match("x.1=1,2", { symbols: ["x"], values: ["1", "2"], symbol_id: "1" });

function merge_symbol_to_values(array_of_symbols_to_values) {
  const out = {};
  for (let i = 0; i < array_of_symbols_to_values.length; i++) {
    const sym_to_vals = array_of_symbols_to_values[i];
    const symbols = sym_to_vals["symbols"];
    for (let j = 0; j < symbols.length; j++) {
      const symbol = symbols[j];
      out[symbol] = { values: sym_to_vals["values"], symbol_id: sym_to_vals["symbol_id"] };
    }
  }
  return out;
}

// merge_symbol_to_values unit tests
assert(
  objectsAreEqual(
    merge_symbol_to_values([
      { symbols: ["x"], values: ["1", "2"] },
      { symbols: ["1", "2"], values: ["f", "g", "h"] },
    ]),
    {
      x: { values: ["1", "2"], symbol_id: undefined },
      1: { values: ["f", "g", "h"], symbol_id: undefined },
      2: { values: ["f", "g", "h"], symbol_id: undefined },
    }
  )
);

function remove_value(idx, values) {
  var value = values[idx];
  values[idx] = values.pop();
  return value;
}

function choose_value(seeded_rand, choices) {
  var i = Math.floor(seeded_rand() * choices.length);
  // console.log("before: " + choices.toString());
  if (i < choices.length - 1) {
    // We need to rearrange the array
    var choice = remove_value(i, choices);
  } else {
    var choice = choices.pop();
  }
  // console.log("after: " + choices.toString());
  return { idx: i, choice: choice };
}

function replace_symbol(symbol, value, text) {
  const re = new RegExp(`SYM\\[${symbol}\\]`, "g");
  return text.replace(re, value);
}

// replace_symbol unit tests
assert(replace_symbol("z", "123", "foo SYM[z] bar") == "foo 123 bar");
assert(replace_symbol("z", "7", "x/SYM[z]") == "x/7");

function parse_expr(str) {
  return Function(`'use strict'; return (${str})`)();
}

const FACTORIAL_VALUES = [
  1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600, 6227020800,
  87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000,
];

function evaluate_factorials(text) {
  // return if text does not contain "!"
  if (!text.includes("!")) {
    return text;
  }

  const re = new RegExp("(-?\\b\\d+)!", "g");
  const matches = text.matchAll(re);
  var increment_indices = 0;

  for (const match of matches) {
    // get the start and end indexes of the entire match
    const start = match.index + increment_indices;
    const end = start + match[0].length;

    const int_str = match[1];
    assert(isInteger(int_str), "factorial value must be an integer");
    const int_val = parseInt(int_str);
    assert(int_val >= 0, "factorial integer must be non-negative");
    assert(
      int_val < FACTORIAL_VALUES.length,
      `factorial integer must be < ${FACTORIAL_VALUES.length}`
    );
    const result = FACTORIAL_VALUES[int_val].toString();
    text = text.slice(0, start) + result + text.slice(end);

    increment_indices += result.length - match[0].length;
  }
  return text;
}

assert(evaluate_factorials("0!") == "1");
assert(evaluate_factorials("Foo 4! BAR") == "Foo 24 BAR");
// assert(evaluate_factorials("-1!")); // should raise an error
// assert(evaluate_factorials(`${FACTORIAL_VALUES.length}!`)); // should raise an error

function replace_expressions(symbol_to_value, text) {
  // symbols in expressions must be separated by white-space or other word-boundaries

  const re = new RegExp("EXP\\[(.*?)\\]", "g");
  // find all appearances of re
  const matches = text.matchAll(re);

  // Because we're changing the length of the output, we need to keep track of
  // by how much and then increment/decrement them appropriately.
  var increment_indices = 0;

  for (const match of matches) {
    // get the start and end indexes of the entire match
    const start = match.index + increment_indices;
    const end = start + match[0].length;

    var expr_str = match[1];

    for (let symbol in symbol_to_value) {
      const value = symbol_to_value[symbol];
      const symbol_re = new RegExp(`\\b${symbol}\\b`, "g");
      expr_str = expr_str.replace(symbol_re, value);
    }
    const intermediate = evaluate_factorials(expr_str);
    const result = parse_expr(intermediate).toString();
    // convert result to string

    // replace `text` from `start` to `end` with `result`
    text = text.slice(0, start) + result + text.slice(end);

    increment_indices += result.length - match[0].length;
  }
  return text;
}

// replace_expressions unit tests
assert(replace_expressions({ x: "2", y: "7" }, "Nothing to replace") == "Nothing to replace");
assert(
  replace_expressions({ x: "2", y: "7", xy: "5" }, "Prefix EXP[x * (y + 1) - xy] suffix") ==
    "Prefix 11 suffix"
);
assert(replace_expressions({ x: "2", y: "7" }, "A EXP[y] B") == "A 7 B");
assert(replace_expressions({ x: "2", y: "7" }, "A EXP[x] EXP[y] B") == "A 2 7 B");
assert(
  replace_expressions(
    { x: "2", y: "7", xy: "5" },
    "Prefix EXP[x * (y + 1)] EXP[y] EXP[xy / (x + 2)] suffix"
  ) == "Prefix 16 7 1.25 suffix"
);
// NB missing symbols in expressions (e.g., if EXP[y] occurs but y is not in
//  symbol_to_table) will cause exceptions.
// assert(replace_expressions({ x: "2" }, "EXP[x + y]")); // Causes a ReferenceError

// Sadly doing this doesn't work for some reason
// function replace_anki_mathjax(text) {
//   text = text.replace(/<anki-mathjax>/g, "\\(");
//   text = text.replace(/<\/anki-mathjax>/g, "\\)");
//   return text;
// }

// assert(
//   replace_anki_mathjax("<anki-mathjax>{EXP[x + y] \\choose SYM[x]}</anki-mathjax>") ==
//     "\\({EXP[x + y] \\choose SYM[x]}\\)"
// );

function replace_substitute_delimiters_with_placeholders(text) {
  text = text.replace(/\\\$\$/g, "START_MATHJAX_BLOCK");
  text = text.replace(/\$\$\\/g, "STOP_MATHJAX_BLOCK");
  text = text.replace(/\\\$/g, "START_MATHJAX");
  text = text.replace(/\$\\/g, "STOP_MATHJAX");
  return text;
}

function replace_placeholders_with_delimiters(text) {
  text = text.replace(/START_MATHJAX_BLOCK/g, "\\[");
  text = text.replace(/STOP_MATHJAX_BLOCK/g, "\\]");
  text = text.replace(/START_MATHJAX/g, "\\(");
  text = text.replace(/STOP_MATHJAX/g, "\\)");
  return text;
}
assert(
  replace_substitute_delimiters_with_placeholders("\\${EXP[x + y] \\choose SYM[x]}$\\") ==
    "START_MATHJAX{EXP[x + y] \\choose SYM[x]}STOP_MATHJAX"
);
assert(
  replace_substitute_delimiters_with_placeholders("\\$${EXP[x + y] \\choose SYM[x]}$$\\") ==
    "START_MATHJAX_BLOCK{EXP[x + y] \\choose SYM[x]}STOP_MATHJAX_BLOCK"
);
assert(
  replace_placeholders_with_delimiters("START_MATHJAX{EXP[x + y] \\choose SYM[x]}STOP_MATHJAX") ==
    "\\({EXP[x + y] \\choose SYM[x]}\\)"
);
assert(
  replace_placeholders_with_delimiters(
    "START_MATHJAX_BLOCK{EXP[x + y] \\choose SYM[x]}STOP_MATHJAX_BLOCK"
  ) == "\\[{EXP[x + y] \\choose SYM[x]}\\]"
);

function populate_fields(vars_field, front, back) {
  // vars_field should be new-line separated string
  //  each item is one or more identifiers followed by = and then
  //    - a set of comma-separated items to choose
  //        e.g., x=1,2,3
  //    - the items of the previous set can also be "ranges":
  //    - an inclusive range of integers separated by : with an optional step
  //        follow a semicolon, e.g., x=3:15 or x=3:15;3
  //    - an inclusive range of characters separated by :, e.g. x=x:z
  //    - there can be more than one identifier on the left hand side, e.g., x,y=a:e.
  //      in that case, we choose without replacement.
  // White space is ignored.
  const seeded_rand = mulberry32(hash_str(front) + get_date());

  // split vars_field on new-lines:
  const vars_fields = vars_field.split("\n");

  const array_of_symbols_to_values = [];

  for (let f_i = 0; f_i < vars_fields.length; f_i++) {
    if (vars_fields[f_i].trim() == "") {
      continue;
    }

    array_of_symbols_to_values.push(match_field(vars_fields[f_i]));
  }
  // console.log(array_of_symbols_to_values);
  const symbol_to_values = merge_symbol_to_values(array_of_symbols_to_values);
  // console.log(symbol_to_values);
  const symbol_to_value = {};
  const id_to_idx = {};

  for (let symbol in symbol_to_values) {
    const values = symbol_to_values[symbol];
    if (values["symbol_id"] in id_to_idx) {
      var value = remove_value(id_to_idx[values["symbol_id"]], values["values"]);
    } else {
      const result = choose_value(seeded_rand, values["values"]);
      var value = result["choice"];
      // TODO allow symbol_id of 0?
      if (values["symbol_id"]) {
        id_to_idx[values["symbol_id"]] = result["idx"];
      }
    }
    if (!value) {
      // TODO maybe the user wants an empty string; it should be possible to check
      //  specifically for undefined
      console.log("WARNING: No choices for symbol " + symbol);
    }
    front = replace_symbol(symbol, value, front);
    if (back) {
      back = replace_symbol(symbol, value, back);
    }
    symbol_to_value[symbol] = value;
  }

  front = replace_expressions(symbol_to_value, front);
  front = replace_placeholders_with_delimiters(front);
  if (back) {
    back = replace_expressions(symbol_to_value, back);
    back = replace_placeholders_with_delimiters(back);
  }

  return { front: front, back: back };
}

function find_shuffle_tags(text) {
  const re = new RegExp(
    "RAN(?<shuffle_group>\\d+)(?:.(?<group_idx>\\d+))?\\[(?<content>[^\\]]*)\\]",
    "g"
  );
  const matches = text.matchAll(re);
  const out = {
    shuffle_groups: new Set([]),
    group_idxs: {},
    contents: {},
    match_text: {},
  };
  for (const match of matches) {
    const shuffle_group = match.groups["shuffle_group"];
    out["shuffle_groups"].add(shuffle_group);
    if (shuffle_group in out["group_idxs"]) {
      assert(
        match.groups["group_idx"] == out["group_idxs"][shuffle_group],
        "All members of shuffle group must have same group index (following the dot)"
      );
    } else if (match.groups["group_idx"]) {
      out["group_idxs"][shuffle_group] = match.groups["group_idx"];
    }
    if (!(shuffle_group in out["contents"])) {
      out["contents"][shuffle_group] = [];
    }
    out["contents"][shuffle_group].push(match.groups["content"]);
    if (!(shuffle_group in out["match_text"])) {
      out["match_text"][shuffle_group] = [];
    }
    out["match_text"][shuffle_group].push(match[0]);
  }
  return out;
}

// find_shuffle_tags unit tests
assert(
  objectsAreEqual(find_shuffle_tags("abcRAN1[foo]def"), {
    shuffle_groups: new Set(["1"]),
    group_idxs: {},
    contents: { 1: ["foo"] },
    match_text: { 1: ["RAN1[foo]"] },
  })
);
assert(
  objectsAreEqual(find_shuffle_tags("RAN1.1[foo] RAN1.1[bar] RAN2.1[hi] RAN2.1[bye]"), {
    shuffle_groups: new Set(["1", "2"]),
    group_idxs: { 1: "1", 2: "1" },
    contents: { 1: ["foo", "bar"], 2: ["hi", "bye"] },
    match_text: {
      1: ["RAN1.1[foo]", "RAN1.1[bar]"],
      2: ["RAN2.1[hi]", "RAN2.1[bye]"],
    },
  })
);
assert(
  objectsAreEqual(find_shuffle_tags("RAN1[]"), {
    shuffle_groups: new Set(["1"]),
    group_idxs: {},
    contents: { 1: [""] },
    match_text: { 1: ["RAN1[]"] },
  })
);

function mulberry32int(a) {
  // From https://stackoverflow.com/a/47593316/10155119 but modified to return integers
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

function shuffle(arr, seeded_rand_int) {
  // const out_arr = arr.slice(); // copy arr

  for (let i = 0; i < arr.length; i++) {
    const rando = seeded_rand_int();
    const dest = (rando % (arr.length - i)) + i;
    const temp = arr[dest];
    arr[dest] = arr[i];
    arr[i] = temp;
  }
}

function apply_shuffle_replacement(text, indices, match_texts, contents) {
  for (let src_i = 0; src_i < indices.length; src_i++) {
    const dst_i = indices[src_i];
    const old_str = match_texts[src_i];
    const new_str = contents[dst_i];
    text = text.replace(old_str, new_str);
  }
  return text;
}

function apply_shuffle_subroutine(text, seeded_rand_int) {
  const shuffle_tags = find_shuffle_tags(text);
  console.log(shuffle_tags);
  group_idx_indices = {};
  for (const shuffle_tag of shuffle_tags["shuffle_groups"].values()) {
    console.log(shuffle_tag);
    const group_idx = shuffle_tags["group_idxs"][shuffle_tag];
    const contents = shuffle_tags["contents"][shuffle_tag];
    if (group_idx && group_idx in group_idx_indices) {
      indices = group_idx_indices[group_idx];
    } else {
      const n_members = contents.length;
      var indices = [];
      for (let i = 0; i < n_members; i++) {
        indices.push(i);
      }
      shuffle(indices, seeded_rand_int);
      if (group_idx) {
        group_idx_indices[group_idx] = indices;
      }
    }
    text = apply_shuffle_replacement(
      text,
      indices,
      shuffle_tags["match_text"][shuffle_tag],
      contents
    );
  }
  return text;
}

function apply_shuffle(front, back) {
  // Shuffle syntax:
  // Items enclosed in RANx.y[] tags will be shuffled together, where `x` is a
  //  nonnegative integer. All items with the same value of `x` are shuffled
  //  together (i.e., they form a "shuffle group").
  // The '.y' is optional. `y` is also a nonnegative integer. All shuffle groups
  //  with the same value of `y` are shuffled in the same order. (E.g., if RAN1.1
  //  is shuffled in the order (2, 1, 3), then RAN2.1 and RAN3.1 will also be given
  //  this order)
  // Shuffle groups must be contained within either front or back.
  // For now shuffling isn't at all coordinated between front and back
  const seeded_rand_int = mulberry32int(hash_str(front) + get_date() + 3);
  front = apply_shuffle_subroutine(front, seeded_rand_int);
  if (back) {
    back = apply_shuffle_subroutine(back, seeded_rand_int);
  }
  return { front: front, back: back };
}
