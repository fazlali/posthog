import ast

from clickhouse_driver.util.escape import escape_param

from posthog.models.property.util import get_property_string_expr

EVENT_FIELDS = ["id", "uuid", "event", "timestamp", "distinct_id"]
PERSON_FIELDS = ["id", "created_at", "properties"]
CLICKHOUSE_FUNCTIONS = ["concat", "coalesce"]


def hogql_expr_to_clickhouse_expr(expr: str) -> str:
    """Converts a HogQL expression to a matching ClickHouse expression"""

    # try a python exception
    try:
        node = ast.parse(expr)
    except SyntaxError as err:
        raise ValueError(f"SyntaxError: {err.msg}")

    return ast_to_clickhouse_expr(node)


def ast_to_clickhouse_expr(node: ast.AST) -> str:
    """Converts an AST to a matching ClickHouse expression"""
    node_type = type(node).__name__

    if type(node) == ast.Module:
        if len(node.body) == 1 and type(node.body[0]) == ast.Expr:
            return ast_to_clickhouse_expr(node.body[0])
        raise ValueError(f"Module body must contain only one 'Expr'")
    elif type(node) == ast.Expr:
        return ast_to_clickhouse_expr(node.value)
    elif type(node) == ast.BinOp:
        if type(node.op) == ast.Add:
            return f"plus({ast_to_clickhouse_expr(node.left)}, {ast_to_clickhouse_expr(node.right)})"
        if type(node.op) == ast.Sub:
            return f"minus({ast_to_clickhouse_expr(node.left)}, {ast_to_clickhouse_expr(node.right)})"
        if type(node.op) == ast.Mult:
            return f"multiply({ast_to_clickhouse_expr(node.left)}, {ast_to_clickhouse_expr(node.right)})"
        if type(node.op) == ast.Div:
            return f"divide({ast_to_clickhouse_expr(node.left)}, {ast_to_clickhouse_expr(node.right)})"
        return f"({ast_to_clickhouse_expr(node.left)} {ast_to_clickhouse_expr(node.op)} {ast_to_clickhouse_expr(node.right)})"
    elif type(node) == ast.UnaryOp:
        return f"{ast_to_clickhouse_expr(node.op)}{ast_to_clickhouse_expr(node.operand)}"
    elif type(node) == ast.USub:
        return "-"
    elif type(node) == ast.Constant:
        if type(node.value) == int or type(node.value) == float:
            return str(node.value)
        elif type(node.value) == str or type(node.value) == list:
            return escape_param(node.value)
        else:
            raise ValueError(f"Unknown AST Constant node type '{type(node.value)}' for value '{str(node.value)}'")
    elif type(node) == ast.Attribute or type(node) == ast.Subscript:
        attribute_chain: list[str] = []
        while True:
            if type(node) == ast.Attribute:
                attribute_chain.insert(0, node.attr)
                node = node.value
            elif type(node) == ast.Subscript:
                if type(node.slice) == ast.Constant:
                    if type(node.slice.value) != str:
                        raise ValueError(
                            f"Only string property access is currently supported, found '{node.slice.value}'"
                        )
                    attribute_chain.insert(0, node.slice.value)
                    node = node.value
                else:
                    raise ValueError(f"Unsupported Subscript slice type: {type(node.slice).__name__}")
            elif type(node) == ast.Name:  # type: ignore
                attribute_chain.insert(0, node.id)
                break
            else:
                raise ValueError(f"Unknown node in field access chain: {ast.dump(node)}")
        return property_access_to_clickhouse(attribute_chain)
    elif type(node) == ast.Call:
        if type(node.func) != ast.Name:
            raise ValueError(f"Can only call simple functions like 'avg(properties.bla)' or 'total()'")

        call_name = node.func.id
        if call_name == "total":
            if len(node.args) != 0:
                raise ValueError(f"Method 'total' does not accept any arguments.")
            return "count(*)"
        elif call_name == "avg":
            if len(node.args) != 1:
                raise ValueError(f"Method 'avg' expects just one argument.")
            return f"avg({ast_to_clickhouse_expr(node.args[0])})"
        if node.func.id in CLICKHOUSE_FUNCTIONS:
            return f"{node.func.id}({', '.join([ast_to_clickhouse_expr(arg) for arg in node.args])})"
        else:
            raise ValueError(f"Unsupported function call '{call_name}(...)'")
    elif type(node) == ast.Name:
        return property_access_to_clickhouse([node.id])

    # This stuff was generated by our helpful AI, property access was way off, but not bad
    #
    # elif node_type == "BoolOp":
    #     return f"{ast_to_clickhouse_expr(node.left)} {node.op.value} {ast_to_clickhouse_expr(node.right)}"
    # elif node_type == "Compare":
    #     return f"{ast_to_clickhouse_expr(node.left)} {node['ops'][0].value} {ast_to_clickhouse_expr(node['comparators'][0])}"
    # elif node_type == "Num":
    #     return str(node["n"])
    # elif node_type == "Str":
    #     return f"'{node['s']}'"
    # elif node_type == "Attribute":
    #     return f"{ast_to_clickhouse_expr(node.value)}.{node['attr']}"
    # elif node_type == "List":
    #     return f"[{', '.join([ast_to_clickhouse_expr(el) for el in node['elts']])}]"
    # elif node_type == "Dict":
    #     return f"{{{', '.join([f'{ast_to_clickhouse_expr(key)}: {ast_to_clickhouse_expr(value)}' for key, value in zip(node['keys'], node['values'])])}}}"
    # elif node_type == "IfExp":
    #     return f"if({ast_to_clickhouse_expr(node['test'])}, {ast_to_clickhouse_expr(node['body'])}, {ast_to_clickhouse_expr(node['orelse'])})"
    # elif node_type == "Tuple":
    #     return f"({', '.join([ast_to_clickhouse_expr(el) for el in node['elts']])})"
    # elif node_type == "Index":
    #     return ast_to_clickhouse_expr(node["value"])
    # elif node_type == "NameConstant":
    #     return str(node["value"])
    # elif node_type == "ListComp":
    #     return f"{ast_to_clickhouse_expr(node['elt'])} {ast_to_clickhouse_expr(node['generators'][0])}"
    # elif node_type == "comprehension":
    #     return f"arrayMap(x -> {ast_to_clickhouse_expr(node['iter'])}, {ast_to_clickhouse_expr(node['target'])})"
    # elif node_type == "Lambda":
    #     return f"arrayMap(x -> {ast_to_clickhouse_expr(node['body'])}, {ast_to_clickhouse_expr(node['args'][0])})"
    else:
        ast.dump(node)
        raise ValueError(f"Unknown AST type {node_type}")


def property_access_to_clickhouse(chain: list[str]):
    if len(chain) == 2:
        if chain[0] == "properties":
            expression, _ = get_property_string_expr(
                "events",
                chain[1],
                escape_param(chain[1]),
                "properties",
            )
            return expression
        elif chain[0] == "person":
            if chain[1] in PERSON_FIELDS:
                return f"person_{chain[1]}"
            else:
                raise ValueError(f"Unknown person field '{chain[1]}'")
    elif len(chain) == 3 and chain[0] == "person" and chain[1] == "properties":
        expression, _ = get_property_string_expr(
            "events",
            chain[2],
            escape_param(chain[2]),
            "person_properties",
        )
        return expression
    elif len(chain) == 1:
        if chain[0] in EVENT_FIELDS:
            if chain[0] == "id":
                return "uuid"
            return chain[0]
        elif chain[0].startswith("person_") and chain[0][7:] in PERSON_FIELDS:
            return chain[0]
        else:
            raise ValueError(f"Unknown event field '{chain[0]}'")

    raise ValueError(f"Unsupported property access: {chain}")
