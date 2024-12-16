# test/expected/oneIssueNoIgnoreComment_quickfixed.py
from typing import Any


class SomeClass:
  some_attribute = 1

def foo(x: SomeClass) -> tuple[Any, Any]:
    some_var = {}
    return x.some_attribute, some_var  # pyright: ignore[reportUnknownVariableType]
