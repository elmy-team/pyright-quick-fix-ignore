from typing import Any


class SomeClass:
  some_attribute = {}

def foo(x: SomeClass) -> tuple[Any, Any]:
    some_var = {}
    return x.some_attribute, some_var  # pyright: ignore[reportUnknownMemberType, reportUnknownVariableType]
