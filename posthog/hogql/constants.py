# HogQL -> ClickHouse allowed transformations
from typing import Optional, Dict, Tuple

from pydantic import BaseModel, Extra

CLICKHOUSE_FUNCTIONS: Dict[str, Tuple[str, int | None, int | None]] = {
    # arithmetic
    "plus": ("plus", 2, 2),
    "minus": ("minus", 2, 2),
    "multiply": ("multiply", 2, 2),
    "divide": ("divide", 2, 2),
    "intDiv": ("intDiv", 2, 2),
    "intDivOrZero": ("intDivOrZero", 2, 2),
    "modulo": ("modulo", 2, 2),
    "moduloOrZero": ("moduloOrZero", 2, 2),
    "positiveModulo": ("positiveModulo", 2, 2),
    "negate": ("negate", 1, 1),
    "abs": ("abs", 1, 1),
    "gcd": ("gcd", 2, 2),
    "lcm": ("lcm", 2, 2),
    "max2": ("max2", 2, 2),
    "min2": ("min2", 2, 2),
    "multiplyDecimal": ("multiplyDecimal", 2, 3),
    "divideDecimal": ("divideDecimal", 2, 3),
    # arrays and strings common
    "empty": ("empty", 1, 1),
    "notEmpty": ("notEmpty", 1, 1),
    "length": ("length", 1, 1),
    "reverse": ("reverse", 1, 1),
    # arrays
    "array": ("array", None, None),
    "range": ("range", 1, 3),
    "arrayConcat": ("arrayConcat", 2, None),
    "arrayElement": ("arrayElement", 2, 2),
    "has": ("has", 2, 2),
    "hasAll": ("hasAll", 2, 2),
    "hasAny": ("hasAny", 2, 2),
    "hasSubstr": ("hasSubstr", 2, 2),
    "indexOf": ("indexOf", 2, 2),
    "arrayCount": ("arrayCount", 1, None),
    "countEqual": ("countEqual", 2, 2),
    "arrayEnumerate": ("arrayEnumerate", 1, 1),
    "arrayEnumerateUniq": ("arrayEnumerateUniq", 2, None),
    "arrayPopBack": ("arrayPopBack", 1, 1),
    "arrayPopFront": ("arrayPopFront", 1, 1),
    "arrayPushBack": ("arrayPushBack", 2, 2),
    "arrayPushFront": ("arrayPushFront", 2, 2),
    "arrayResize": ("arrayResize", 2, 3),
    "arraySlice": ("arraySlice", 2, 3),
    "arraySort": ("arraySort", 1, None),
    "arrayReverseSort": ("arraySort", 1, None),
    "arrayUniq": ("arrayUniq", 1, None),
    "arrayJoin": ("arrayJoin", 1, 1),
    "arrayDifference": ("arrayDifference", 1, 1),
    "arrayDistinct": ("arrayDistinct", 1, 1),
    "arrayEnumerateDense": ("arrayEnumerateDense", 1, 1),
    "arrayIntersect": ("arrayIntersect", 1, None),
    # "arrayReduce": ("arrayReduce", 2, None),  # takes a "parametric function" as first arg, is that safe?
    # "arrayReduceInRanges": ("arrayReduceInRanges", 3, None),  # takes a "parametric function" as first arg, is that safe?
    "arrayReverse": ("arrayReverse", 1, 1),
    "arrayFilter": ("arrayFilter", 2, None),
    "arrayFlatten": ("arrayFlatten", 1, 1),
    "arrayCompact": ("arrayCompact", 1, 1),
    "arrayZip": ("arrayZip", 2, None),
    "arrayAUC": ("arrayAUC", 2, 2),
    "arrayMap": ("arrayMap", 2, None),
    "arrayFill": ("arrayFill", 2, None),
    "arraySplit": ("arraySplit", 2, None),
    "arrayReverseFill": ("arrayReverseFill", 2, None),
    "arrayReverseSplit": ("arrayReverseSplit", 2, None),
    "arrayExists": ("arrayExists", 1, None),
    "arrayAll": ("arrayAll", 1, None),
    "arrayFirst": ("arrayFirst", 2, None),
    "arrayLast": ("arrayLast", 2, None),
    "arrayFirstIndex": ("arrayFirstIndex", 2, None),
    "arrayLastIndex": ("arrayLastIndex", 2, None),
    "arrayMin": ("arrayMin", 1, 2),
    "arrayMax": ("arrayMax", 1, 2),
    "arraySum": ("arraySum", 1, 2),
    "arrayAvg": ("arrayAvg", 1, 2),
    "arrayCumSum": ("arrayCumSum", 1, None),
    "arrayCumSumNonNegative": ("arrayCumSumNonNegative", 1, None),
    "arrayProduct": ("arrayProduct", 1, 1),
    # comparison
    "equals": ("equals", 2, 2),
    "notEquals": ("notEquals", 2, 2),
    "less": ("less", 2, 2),
    "greater": ("greater", 2, 2),
    "lessOrEquals": ("lessOrEquals", 2, 2),
    "greaterOrEquals": ("greaterOrEquals", 2, 2),
    # logical
    "and": ("and", 2, None),
    "or": ("or", 2, None),
    "xor": ("xor", 2, None),
    "not": ("not", 1, 1),
    # type conversions
    "toInt": ("toInt64OrNull", 1, 1),
    "toFloat": ("toFloat64OrNull", 1, 1),
    "toDecimal": ("toDecimal64OrNull", 1, 1),
    "toDate": ("toDateOrNull", 1, 1),
    "toDateTime": ("toDateTimeOrNull", 1, 1),
    "toUUID": ("toUUIDOrNull", 1, 1),
    "toString": ("toString", 1, 1),
    "toJSONString": ("toJSONString", 1, 1),
    "parseDateTime": ("parseDateTimeOrNull", 2, 2),
    "parseDateTimeBestEffort": ("parseDateTimeBestEffortOrNull", 2, 2),
    # dates and times
    "toTimezone": ("toTimezone", 2, 2),
    "timeZoneOf": ("timeZoneOf", 1, 1),
    "timeZoneOffset": ("timeZoneOffset", 1, 1),
    "toYear": ("toYear", 1, 1),
    "toQuarter": ("toQuarter", 1, 1),
    "toMonth": ("toMonth", 1, 1),
    "toDayOfYear": ("toDayOfYear", 1, 1),
    "toDayOfMonth": ("toDayOfMonth", 1, 1),
    "toDayOfWeek": ("toDayOfWeek", 1, 3),
    "toHour": ("toHour", 1, 1),
    "toMinute": ("toMinute", 1, 1),
    "toSecond": ("toSecond", 1, 1),
    "toUnixTimestamp": ("toUnixTimestamp", 1, 2),
    "toStartOfYear": ("toStartOfYear", 1, 1),
    "toStartOfISOYear": ("toStartOfISOYear", 1, 1),
    "toStartOfQuarter": ("toStartOfQuarter", 1, 1),
    "toStartOfMonth": ("toStartOfMonth", 1, 1),
    "toLastDayOfMonth": ("toLastDayOfMonth", 1, 1),
    "toMonday": ("toMonday", 1, 1),
    "toStartOfWeek": ("toStartOfWeek", 1, 1),
    "toStartOfDay": ("toStartOfDay", 1, 1),
    "toStartOfHour": ("toStartOfHour", 1, 1),
    "toStartOfMinute": ("toStartOfMinute", 1, 1),
    "toStartOfSecond": ("toStartOfSecond", 1, 1),
    "toStartOfFiveMinutes": ("toStartOfFiveMinutes", 1, 1),
    "toStartOfTenMinutes": ("toStartOfTenMinutes", 1, 1),
    "toStartOfFifteenMinutes": ("toStartOfFifteenMinutes", 1, 1),
    "toTime": ("toTime", 1, 1),
    "toISOYear": ("toISOYear", 1, 1),
    "toISOWeek": ("toISOWeek", 1, 1),
    "toWeek": ("toWeek", 1, 3),
    "toYearWeek": ("toYearWeek", 1, 3),
    "age": ("age", 3, 3),
    "dateDiff": ("dateDiff", 3, 3),
    "dateTrunc": ("dateTrunc", 2, 2),
    "dateAdd": ("dateAdd", 3, 3),
    "dateSub": ("dateSub", 3, 3),
    "timeStampAdd": ("timeStampAdd", 2, 2),
    "timeStampSub": ("timeStampSub", 2, 2),
    "now": ("now", 0, 0),
    "NOW": ("now", 0, 0),
    "now64": ("now64", 1, 1),
    "nowInBlock": ("nowInBlock", 1, 1),
    "today": ("today", 0, 0),
    "yesterday": ("yesterday", 0, 0),
    "timeSlot": ("timeSlot", 1, 1),
    "toYYYYMM": ("toYYYYMM", 1, 1),
    "toYYYYMMDD": ("toYYYYMMDD", 1, 1),
    "toYYYYMMDDhhmmss": ("toYYYYMMDDhhmmss", 1, 1),
    "addYears": ("addYears", 2, 2),
    "addMonths": ("addMonths", 2, 2),
    "addWeeks": ("addWeeks", 2, 2),
    "addDays": ("addDays", 2, 2),
    "addHours": ("addHours", 2, 2),
    "addMinutes": ("addMinutes", 2, 2),
    "addSeconds": ("addSeconds", 2, 2),
    "addQuarters": ("addQuarters", 2, 2),
    "subtractYears": ("subtractYears", 2, 2),
    "subtractMonths": ("subtractMonths", 2, 2),
    "subtractWeeks": ("subtractWeeks", 2, 2),
    "subtractDays": ("subtractDays", 2, 2),
    "subtractHours": ("subtractHours", 2, 2),
    "subtractMinutes": ("subtractMinutes", 2, 2),
    "subtractSeconds": ("subtractSeconds", 2, 2),
    "subtractQuarters": ("subtractQuarters", 2, 2),
    "timeSlots": ("timeSlots", 2, 3),
    "formatDateTime": ("formatDateTime", 2, 2),
    "dateName": ("dateName", 2, 2),
    "monthName": ("monthName", 1, 1),
    "fromUnixTimestamp": ("fromUnixTimestamp", 1, 1),
    "toModifiedJulianDay": ("toModifiedJulianDayOrNull", 1, 1),
    "fromModifiedJulianDay": ("fromModifiedJulianDayOrNull", 1, 1),
    "toIntervalSecond": ("toIntervalSecond", 1, 1),
    "toIntervalMinute": ("toIntervalMinute", 1, 1),
    "toIntervalHour": ("toIntervalHour", 1, 1),
    "toIntervalDay": ("toIntervalDay", 1, 1),
    "toIntervalWeek": ("toIntervalWeek", 1, 1),
    "toIntervalMonth": ("toIntervalMonth", 1, 1),
    "toIntervalQuarter": ("toIntervalQuarter", 1, 1),
    "toIntervalYear": ("toIntervalYear", 1, 1),
    # strings
    "lengthUTF8": ("lengthUTF8", 1, 1),
    "leftPad": ("leftPad", 2, 3),
    "rightPad": ("rightPad", 2, 3),
    "leftPadUTF8": ("leftPadUTF8", 2, 3),
    "rightPadUTF8": ("rightPadUTF8", 2, 3),
    "lower": ("lower", 1, 1),
    "upper": ("upper", 1, 1),
    "lowerUTF8": ("lowerUTF8", 1, 1),
    "upperUTF8": ("upperUTF8", 1, 1),
    "isValidUTF8": ("isValidUTF8", 1, 1),
    "toValidUTF8": ("toValidUTF8", 1, 1),
    "repeat": ("repeat", 2, 2),
    "format": ("format", 2, None),
    "reverseUTF8": ("reverseUTF8", 1, 1),
    "concat": ("concat", 2, None),
    "substring": ("substring", 3, 3),
    "substringUTF8": ("substringUTF8", 3, 3),
    "appendTrailingCharIfAbsent": ("appendTrailingCharIfAbsent", 2, 2),
    "convertCharset": ("convertCharset", 3, 3),
    "base58Encode": ("base58Encode", 1, 1),
    "base58Decode": ("base58Decode", 1, 1),
    "tryBase58Decode": ("tryBase58Decode", 1, 1),
    "base64Encode": ("base64Encode", 1, 1),
    "base64Decode": ("base64Decode", 1, 1),
    "tryBase64Decode": ("tryBase64Decode", 1, 1),
    "endsWith": ("endsWith", 2, 2),
    "startsWith": ("startsWith", 2, 2),
    "trim": ("trimBoth", 1, 1),
    "trimLeft": ("trimLeft", 1, 1),
    "trimRight": ("trimRight", 1, 1),
    "encodeXMLComponent": ("encodeXMLComponent", 1, 1),
    "decodeXMLComponent": ("decodeXMLComponent", 1, 1),
    "extractTextFromHTML": ("extractTextFromHTML", 1, 1),
    "ascii": ("ascii", 1, 1),
    "concatWithSeparator": ("concatWithSeparator", 2, None),
    # searching in strings
    "position": ("position", 2, 3),
    "positionCaseInsensitive": ("positionCaseInsensitive", 2, 3),
    "positionUTF8": ("positionUTF8", 2, 3),
    "positionCaseInsensitiveUTF8": ("positionCaseInsensitiveUTF8", 2, 3),
    "multiSearchAllPositions": ("multiSearchAllPositions", 2, 2),
    "multiSearchAllPositionsUTF8": ("multiSearchAllPositionsUTF8", 2, 2),
    "multiSearchFirstPosition": ("multiSearchFirstPosition", 2, 2),
    "multiSearchFirstIndex": ("multiSearchFirstIndex", 2, 2),
    "multiSearchAny": ("multiSearchAny", 2, 2),
    "match": ("match", 2, 2),
    "multiMatchAny": ("multiMatchAny", 2, 2),
    "multiMatchAnyIndex": ("multiMatchAnyIndex", 2, 2),
    "multiMatchAllIndices": ("multiMatchAllIndices", 2, 2),
    "multiFuzzyMatchAny": ("multiFuzzyMatchAny", 3, 3),
    "multiFuzzyMatchAnyIndex": ("multiFuzzyMatchAnyIndex", 3, 3),
    "multiFuzzyMatchAllIndices": ("multiFuzzyMatchAllIndices", 3, 3),
    "extract": ("extract", 2, 2),
    "extractAll": ("extractAll", 2, 2),
    "extractAllGroupsHorizontal": ("extractAllGroupsHorizontal", 2, 2),
    "extractAllGroupsVertical": ("extractAllGroupsVertical", 2, 2),
    "like": ("like", 2, 2),
    "ilike": ("ilike", 2, 2),
    "notLike": ("notLike", 2, 2),
    "notILike": ("notILike", 2, 2),
    "ngramDistance": ("ngramDistance", 2, 2),
    "ngramSearch": ("ngramSearch", 2, 2),
    "countSubstrings": ("countSubstrings", 2, 3),
    "countSubstringsCaseInsensitive": ("countSubstringsCaseInsensitive", 2, 3),
    "countSubstringsCaseInsensitiveUTF8": ("countSubstringsCaseInsensitiveUTF8", 2, 3),
    "countMatches": ("countMatches", 2, 2),
    "regexpExtract": ("regexpExtract", 2, 3),
    # replacing in strings
    "replace": ("replace", 3, 3),
    "replaceAll": ("replaceAll", 3, 3),
    "replaceOne": ("replaceOne", 3, 3),
    "replaceRegexpAll": ("replaceRegexpAll", 3, 3),
    "replaceRegexpOne": ("replaceRegexpOne", 3, 3),
    "regexpQuoteMeta": ("regexpQuoteMeta", 1, 1),
    "translate": ("translate", 3, 3),
    "translateUTF8": ("translateUTF8", 3, 3),
    # conditional
    "if": ("if", 3, 3),
    "multiIf": ("multiIf", 3, None),
    # mathematical
    "e": ("e", 0, 0),
    "pi": ("pi", 0, 0),
    "exp": ("exp", 1, 1),
    "log": ("log", 1, 1),
    "ln": ("ln", 1, 1),
    "exp2": ("exp2", 1, 1),
    "log2": ("log2", 1, 1),
    "exp10": ("exp10", 1, 1),
    "log10": ("log10", 1, 1),
    "sqrt": ("sqrt", 1, 1),
    "cbrt": ("cbrt", 1, 1),
    "erf": ("erf", 1, 1),
    "erfc": ("erfc", 1, 1),
    "lgamma": ("lgamma", 1, 1),
    "tgamma": ("tgamma", 1, 1),
    "sin": ("sin", 1, 1),
    "cos": ("cos", 1, 1),
    "tan": ("tan", 1, 1),
    "asin": ("asin", 1, 1),
    "acos": ("acos", 1, 1),
    "atan": ("atan", 1, 1),
    "pow": ("pow", 2, 2),
    "power": ("power", 2, 2),
    "intExp2": ("intExp2", 1, 1),
    "intExp10": ("intExp10", 1, 1),
    "cosh": ("cosh", 1, 1),
    "acosh": ("acosh", 1, 1),
    "sinh": ("sinh", 1, 1),
    "asinh": ("asinh", 1, 1),
    "atanh": ("atanh", 1, 1),
    "atan2": ("atan2", 2, 2),
    "hypot": ("hypot", 2, 2),
    "log1p": ("log1p", 1, 1),
    "sign": ("sign", 1, 1),
    "degrees": ("degrees", 1, 1),
    "radians": ("radians", 1, 1),
    "factorial": ("factorial", 1, 1),
    "width_bucket": ("width_bucket", 4, 4),
    # rounding
    "floor": ("floor", 1, 2),
    "ceil": ("ceil", 1, 2),
    "trunc": ("trunc", 1, 2),
    "round": ("round", 1, 2),
    "roundBankers": ("roundBankers", 1, 2),
    "roundToExp2": ("roundToExp2", 1, 1),
    "roundDuration": ("roundDuration", 1, 1),
    "roundAge": ("roundAge", 1, 1),
    "roundDown": ("roundDown", 2, 2),
    # maps
    "map": ("map", 2, None),
    "mapFromArrays": ("mapFromArrays", 2, 2),
    "mapAdd": ("mapAdd", 2, None),
    "mapSubtract": ("mapSubtract", 2, None),
    "mapPopulateSeries": ("mapPopulateSeries", 1, 3),
    "mapContains": ("mapContains", 2, 2),
    "mapKeys": ("mapKeys", 1, 1),
    "mapValues": ("mapValues", 1, 1),
    "mapContainsKeyLike": ("mapContainsKeyLike", 2, 2),
    "mapExtractKeyLike": ("mapExtractKeyLike", 2, 2),
    "mapApply": ("mapApply", 2, 2),
    "mapFilter": ("mapFilter", 2, 2),
    "mapUpdate": ("mapUpdate", 2, 2),
    # splitting strings
    "splitByChar": ("splitByChar", 3, 3),
    "splitByString": ("splitByString", 3, 3),
    "splitByRegexp": ("splitByRegexp", 3, 3),
    "splitByWhitespace": ("splitByWhitespace", 2, 2),
    "splitByNonAlpha": ("splitByNonAlpha", 2, 2),
    "arrayStringConcat": ("arrayStringConcat", 1, 2),
    "alphaTokens": ("alphaTokens", 2, 2),
    "extractAllGroups": ("extractAllGroups", 2, 2),
    "ngrams": ("ngrams", 2, 2),
    "tokens": ("tokens", 1, 1),
    # bit
    "bitAnd": ("bitAnd", 2, 2),
    "bitOr": ("bitOr", 2, 2),
    "bitXor": ("bitXor", 2, 2),
    "bitNot": ("bitNot", 1, 1),
    "bitShiftLeft": ("bitShiftLeft", 2, 2),
    "bitShiftRight": ("bitShiftRight", 2, 2),
    "bitRotateLeft": ("bitRotateLeft", 2, 2),
    "bitRotateRight": ("bitRotateRight", 2, 2),
    "bitSlice": ("bitSlice", 3, 3),
    "bitTest": ("bitTest", 2, 2),
    "bitTestAll": ("bitTestAll", 3, None),
    "bitTestAny": ("bitTestAny", 3, None),
    "bitCount": ("bitCount", 1, 1),
    "bitHammingDistance": ("bitHammingDistance", 2, 2),
    # bitmap
    "bitmapBuild": ("bitmapBuild", 1, 1),
    "bitmapToArray": ("bitmapToArray", 1, 1),
    "bitmapSubsetInRange": ("bitmapSubsetInRange", 3, 3),
    "bitmapSubsetLimit": ("bitmapSubsetLimit", 3, 3),
    "subBitmap": ("subBitmap", 3, 3),
    "bitmapContains": ("bitmapContains", 2, 2),
    "bitmapHasAny": ("bitmapHasAny", 2, 2),
    "bitmapHasAll": ("bitmapHasAll", 2, 2),
    "bitmapCardinality": ("bitmapCardinality", 1, 1),
    "bitmapMin": ("bitmapMin", 1, 1),
    "bitmapMax": ("bitmapMax", 1, 1),
    "bitmapTransform": ("bitmapTransform", 3, 3),
    "bitmapAnd": ("bitmapAnd", 2, 2),
    "bitmapOr": ("bitmapOr", 2, 2),
    "bitmapXor": ("bitmapXor", 2, 2),
    "bitmapAndnot": ("bitmapAndnot", 2, 2),
    "bitmapAndCardinality": ("bitmapAndCardinality", 2, 2),
    "bitmapOrCardinality": ("bitmapOrCardinality", 2, 2),
    "bitmapXorCardinality": ("bitmapXorCardinality", 2, 2),
    "bitmapAndnotCardinality": ("bitmapAndnotCardinality", 2, 2),
    # urls TODO
    "protocol": ("protocol", 1, 1),
    "domain": ("domain", 1, 1),
    "domainWithoutWWW": ("domainWithoutWWW", 1, 1),
    "topLevelDomain": ("topLevelDomain", 1, 1),
    "firstSignificantSubdomain": ("firstSignificantSubdomain", 1, 1),
    "cutToFirstSignificantSubdomain": ("cutToFirstSignificantSubdomain", 1, 1),
    "cutToFirstSignificantSubdomainWithWWW": ("cutToFirstSignificantSubdomainWithWWW", 1, 1),
    "port": ("port", 1, 2),
    "path": ("path", 1, 1),
    "pathFull": ("pathFull", 1, 1),
    "queryString": ("queryString", 1, 1),
    "fragment": ("fragment", 1, 1),
    "queryStringAndFragment": ("queryStringAndFragment", 1, 1),
    "extractURLParameter": ("extractURLParameter", 2, 2),
    "extractURLParameters": ("extractURLParameters", 1, 1),
    "extractURLParameterNames": ("extractURLParameterNames", 1, 1),
    "URLHierarchy": ("URLHierarchy", 1, 1),
    "URLPathHierarchy": ("URLPathHierarchy", 1, 1),
    "encodeURLComponent": ("encodeURLComponent", 1, 1),
    "decodeURLComponent": ("decodeURLComponent", 1, 1),
    "encodeURLFormComponent": ("encodeURLFormComponent", 1, 1),
    "decodeURLFormComponent": ("decodeURLFormComponent", 1, 1),
    "netloc": ("netloc", 1, 1),
    "cutWWW": ("cutWWW", 1, 1),
    "cutQueryString": ("cutQueryString", 1, 1),
    "cutFragment": ("cutFragment", 1, 1),
    "cutQueryStringAndFragment": ("cutQueryStringAndFragment", 1, 1),
    "cutURLParameter": ("cutURLParameter", 2, 2),
    # json
    "isValidJSON": ("isValidJSON", 1, 1),
    "JSONHas": ("JSONHas", 1, None),
    "JSONLength": ("JSONLength", 1, None),
    "JSONArrayLength": ("JSONArrayLength", 1, None),
    "JSONType": ("JSONType", 1, None),
    "JSONExtractUInt": ("JSONExtractUInt", 1, None),
    "JSONExtractInt": ("JSONExtractInt", 1, None),
    "JSONExtractFloat": ("JSONExtractFloat", 1, None),
    "JSONExtractBool": ("JSONExtractBool", 1, None),
    "JSONExtractString": ("JSONExtractString", 1, None),
    "JSONExtractKey": ("JSONExtractKey", 1, None),
    "JSONExtractKeys": ("JSONExtractKeys", 1, None),
    "JSONExtractRaw": ("JSONExtractRaw", 1, None),
    "JSONExtractArrayRaw": ("JSONExtractArrayRaw", 1, None),
    "JSONExtractKeysAndValuesRaw": ("JSONExtractKeysAndValuesRaw", 1, None),
    # in
    "in": ("in", 2, 2),
    "notIn": ("notIn", 2, 2),
    # geo
    "greatCircleDistance": ("greatCircleDistance", 4, 4),
    "geoDistance": ("geoDistance", 4, 4),
    "greatCircleAngle": ("greatCircleAngle", 4, 4),
    "pointInEllipses": ("pointInEllipses", 6, None),
    "pointInPolygon": ("pointInPolygon", 2, None),
    # nullable
    "isNull": ("isNull", 1, 1),
    "isNotNull": ("isNotNull", 1, 1),
    "coalesce": ("coalesce", 1, None),
    "ifNull": ("ifNull", 2, 2),
    "nullIf": ("nullIf", 2, 2),
    "assumeNotNull": ("assumeNotNull", 1, 1),
    "toNullable": ("toNullable", 1, 1),
    # tuples
    "tuple": ("tuple", None, None),
    "tupleElement": ("tupleElement", 2, 3),
    "untuple": ("untuple", 1, 1),
    "tupleHammingDistance": ("tupleHammingDistance", 2, 2),
    "tupleToNameValuePairs": ("tupleToNameValuePairs", 1, 1),
    "tuplePlus": ("tuplePlus", 2, 2),
    "tupleMinus": ("tupleMinus", 2, 2),
    "tupleMultiply": ("tupleMultiply", 2, 2),
    "tupleDivide": ("tupleDivide", 2, 2),
    "tupleNegate": ("tupleNegate", 1, 1),
    "tupleMultiplyByNumber": ("tupleMultiplyByNumber", 2, 2),
    "tupleDivideByNumber": ("tupleDivideByNumber", 2, 2),
    "dotProduct": ("dotProduct", 2, 2),
    # other
    "isFinite": ("isFinite", 1, 1),
    "isInfinite": ("isInfinite", 1, 1),
    "ifNotFinite": ("ifNotFinite", 1, 1),
    "isNaN": ("isNaN", 1, 1),
    "bar": ("bar", 4, 4),
    "transform": ("transform", 3, 4),
    "formatReadableDecimalSize": ("formatReadableDecimalSize", 1, 1),
    "formatReadableSize": ("formatReadableSize", 1, 1),
    "formatReadableQuantity": ("formatReadableQuantity", 1, 1),
    "formatReadableTimeDelta": ("formatReadableTimeDelta", 1, 2),
    # time window
    "tumble": ("tumble", 2, 2),
    "hop": ("hop", 3, 3),
    "tumbleStart": ("tumbleStart", 1, 3),
    "tumbleEnd": ("tumbleEnd", 1, 3),
    "hopStart": ("hopStart", 1, 3),
    "hopEnd": ("hopEnd", 1, 3),
    # distance window
    "L1Norm": ("L1Norm", 1, 1),
    "L2Norm": ("L2Norm", 1, 1),
    "LinfNorm": ("LinfNorm", 1, 1),
    "LpNorm": ("LpNorm", 2, 2),
    "L1Distance": ("L1Distance", 2, 2),
    "L2Distance": ("L2Distance", 2, 2),
    "LinfDistance": ("LinfDistance", 2, 2),
    "LpDistance": ("LpDistance", 3, 3),
    "L1Normalize": ("L1Normalize", 1, 1),
    "L2Normalize": ("L2Normalize", 1, 1),
    "LinfNormalize": ("LinfNormalize", 1, 1),
    "LpNormalize": ("LpNormalize", 2, 2),
    "cosineDistance": ("cosineDistance", 2, 2),
}
# Permitted HogQL aggregations
HOGQL_AGGREGATIONS = {
    "count": (0, 1),
    "countIf": (1, 2),
    "min": 1,
    "minIf": 2,
    "max": 1,
    "maxIf": 2,
    "sum": 1,
    "sumIf": 2,
    "avg": 1,
    "avgIf": 2,
    "any": 1,
    "anyIf": 2,
    "argMax": 2,
    "argMin": 2,
    # TODO: more aggregate functions?
}
ADD_TIMEZONE_TO_FUNCTIONS = ("now", "now64", "NOW", "toDateTime")
# Keywords passed to ClickHouse without transformation
KEYWORDS = ["true", "false", "null"]

# Keywords you can't alias to
RESERVED_KEYWORDS = KEYWORDS + ["team_id"]

# Never return more rows than this in top level HogQL SELECT statements
DEFAULT_RETURNED_ROWS = 100
MAX_SELECT_RETURNED_ROWS = 65535

# Settings applied on top of all HogQL queries.
class HogQLSettings(BaseModel):
    class Config:
        extra = Extra.forbid

    readonly: Optional[int] = 1
    max_execution_time: Optional[int] = 60
