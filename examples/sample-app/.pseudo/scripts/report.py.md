# scripts/report.py

- Language: python
- Summary: Nightly sales report generator. 4 symbol(s): Report, Report.__init__, Report.summarize, load

## CLASS Report  _(line 4)_

> Aggregates rows into a summary.

## METHOD Report.__init__(self, rows)  _(line 6)_

1. (straight-line body)

## METHOD Report.summarize(self, by="region")  _(line 9)_

> Group totals by a column.

1. For each row in self.rows
2. Note: skip refunds
3. If row["amount"] < 0
4. Return out

## FUNCTION load(path)  _(line 19)_

1. Return list(csv.DictReader(f))
