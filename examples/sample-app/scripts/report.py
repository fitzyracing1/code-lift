"""Nightly sales report generator."""
import csv

class Report:
    """Aggregates rows into a summary."""
    def __init__(self, rows):
        self.rows = rows

    def summarize(self, by="region"):
        """Group totals by a column."""
        out = {}
        for row in self.rows:
            # skip refunds
            if row["amount"] < 0:
                continue
            out[row[by]] = out.get(row[by], 0) + row["amount"]
        return out

def load(path):
    with open(path) as f:
        return list(csv.DictReader(f))
