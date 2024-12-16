
from typing import Any


class PartiallyTyped:
  unknown_type_attribute = {}

def foo(x: PartiallyTyped) -> tuple[Any, Any]:
    unknown_type_var = {}
    return x.unknown_type_attribute, unknown_type_var  # pyright: ignore[reportUnknownMemberType, reportUnknownVariableType]
