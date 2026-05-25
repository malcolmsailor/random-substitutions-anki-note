# Math Practice Card Syntax

Cards have three fields: **Front**, **Back**, and **Vars**. Specified elements are randomized on each review so that the student focuses on the technique rather than specific values.

## Vars

Newline-separated variable definitions of the form `symbol=values`.

**Left side** (symbol names):
- A single symbol: `x=...`
- Multiple symbols (sampled without replacement): `a,b,c=...`
- Grouped symbols (same group ID = same index chosen): `x.1=...`, `y.1=...`

**Right side** (possible values):
- Comma-separated list: `3,7,11` or `apple,banana,cherry`
- Integer range (inclusive): `3:10` means {3, 4, ..., 10}
- Integer range with step: `2:10;2` means {2, 4, 6, 8, 10}
- Character range: `a:d` means {a, b, c, d}

Ranges must be ascending (`3:10` not `10:3`; `a:d` not `d:a`).

### Vars examples

```
x=4:10;2
a,b=x:z
z.1=7,12,p
elements.1=bat,ball,glove
```

Here `z.1` and `elements.1` share group `1`, so they always get the value at the same index (e.g., if `z.1` is `12`, then `elements.1` is `ball`).

## Front and Back

Both fields support markdown and MathJax (LaTeX). Math delimiters:
- Inline: `\$` ... `$\`
- Display: `\$$` ... `$$\`

(These are custom delimiters, not the usual `\(...\)` / `\[...\]`.)

### Replacement fields

- **`SYM[id]`** — replaced by the value of variable `id` from Vars.
- **`EXP[expr]`** — evaluates a JavaScript expression. Can reference numeric Vars symbols. The factorial operator `!` is available for nonnegative integers up to 18.

A symbol's value is consistent across Front and Back for a given day.

### Shuffle syntax

`RANx[content]` randomly reorders items sharing shuffle group `x` (a nonnegative integer). Optionally, `RANx.y[content]` links shuffle groups: groups with the same `.y` are shuffled in the same order.

## Examples

### Example 1

Front:
```
How many ways are there to divide SYM[m] identical SYM[objects] among SYM[n] different SYM[recipients]?
```

Back:
```
\$ { EXP[m + n - 1] \choose EXP[n - 1] } $\
```

Vars:
```
m=3:10
n=2:7
objects=candies,gifts,votes,dollars
recipients=people,students,politicians
```

### Example 2

Front:
```
If the rate of not having a SYM[thing] is SYM[x]%, what is the chance that a random sample of SYM[N] people will all have a SYM[thing]?
```

Back:
```
\$ (EXP[1 - (x / 100)])^{SYM[N]} = EXP[(1 - x / 100)**N] $\
```

Vars:
```
x=5:35;5
N=12:32;4
thing=job,car,diploma
```
