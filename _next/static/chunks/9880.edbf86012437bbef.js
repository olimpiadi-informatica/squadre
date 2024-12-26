"use strict";(globalThis.webpackChunk_N_E=globalThis.webpackChunk_N_E||[]).push([[9880],{99880:(e,n,t)=>{t.r(n),t.d(n,{default:()=>o});let o=[Object.freeze(JSON.parse('{"displayName":"Groovy","name":"groovy","patterns":[{"captures":{"1":{"name":"punctuation.definition.comment.groovy"}},"match":"^(#!).+$\\\\n","name":"comment.line.hashbang.groovy"},{"captures":{"1":{"name":"keyword.other.package.groovy"},"2":{"name":"storage.modifier.package.groovy"},"3":{"name":"punctuation.terminator.groovy"}},"match":"^\\\\s*(package)\\\\b(?:\\\\s*([^ ;$]+)\\\\s*(;)?)?","name":"meta.package.groovy"},{"begin":"(import static)\\\\b\\\\s*","beginCaptures":{"1":{"name":"keyword.other.import.static.groovy"}},"captures":{"1":{"name":"keyword.other.import.groovy"},"2":{"name":"storage.modifier.import.groovy"},"3":{"name":"punctuation.terminator.groovy"}},"contentName":"storage.modifier.import.groovy","end":"\\\\s*(?:$|(?=%>)(;))","endCaptures":{"1":{"name":"punctuation.terminator.groovy"}},"name":"meta.import.groovy","patterns":[{"match":"\\\\.","name":"punctuation.separator.groovy"},{"match":"\\\\s","name":"invalid.illegal.character_not_allowed_here.groovy"}]},{"begin":"(import)\\\\b\\\\s*","beginCaptures":{"1":{"name":"keyword.other.import.groovy"}},"captures":{"1":{"name":"keyword.other.import.groovy"},"2":{"name":"storage.modifier.import.groovy"},"3":{"name":"punctuation.terminator.groovy"}},"contentName":"storage.modifier.import.groovy","end":"\\\\s*(?:$|(?=%>)|(;))","endCaptures":{"1":{"name":"punctuation.terminator.groovy"}},"name":"meta.import.groovy","patterns":[{"match":"\\\\.","name":"punctuation.separator.groovy"},{"match":"\\\\s","name":"invalid.illegal.character_not_allowed_here.groovy"}]},{"captures":{"1":{"name":"keyword.other.import.groovy"},"2":{"name":"keyword.other.import.static.groovy"},"3":{"name":"storage.modifier.import.groovy"},"4":{"name":"punctuation.terminator.groovy"}},"match":"^\\\\s*(import)(?:\\\\s+(static)\\\\s+)\\\\b(?:\\\\s*([^ ;$]+)\\\\s*(;)?)?","name":"meta.import.groovy"},{"include":"#groovy"}],"repository":{"annotations":{"patterns":[{"begin":"(?<!\\\\.)(@[^ (]+)(\\\\()","beginCaptures":{"1":{"name":"storage.type.annotation.groovy"},"2":{"name":"punctuation.definition.annotation-arguments.begin.groovy"}},"end":"(\\\\))","endCaptures":{"1":{"name":"punctuation.definition.annotation-arguments.end.groovy"}},"name":"meta.declaration.annotation.groovy","patterns":[{"captures":{"1":{"name":"constant.other.key.groovy"},"2":{"name":"keyword.operator.assignment.groovy"}},"match":"(\\\\w*)\\\\s*(=)"},{"include":"#values"},{"match":",","name":"punctuation.definition.seperator.groovy"}]},{"match":"(?<!\\\\.)@\\\\S+","name":"storage.type.annotation.groovy"}]},"anonymous-classes-and-new":{"begin":"\\\\bnew\\\\b","beginCaptures":{"0":{"name":"keyword.control.new.groovy"}},"end":"(?<=\\\\)|\\\\])(?!\\\\s*{)|(?<=})|(?=[;])|$","patterns":[{"begin":"(\\\\w+)\\\\s*(?=\\\\[)","beginCaptures":{"1":{"name":"storage.type.groovy"}},"end":"}|(?=\\\\s*(?:,|;|\\\\)))|$","patterns":[{"begin":"\\\\[","end":"\\\\]","patterns":[{"include":"#groovy"}]},{"begin":"{","end":"(?=})","patterns":[{"include":"#groovy"}]}]},{"begin":"(?=\\\\w.*\\\\(?)","end":"(?<=\\\\))|$","patterns":[{"include":"#object-types"},{"begin":"\\\\(","beginCaptures":{"1":{"name":"storage.type.groovy"}},"end":"\\\\)","patterns":[{"include":"#groovy"}]}]},{"begin":"{","end":"}","name":"meta.inner-class.groovy","patterns":[{"include":"#class-body"}]}]},"braces":{"begin":"\\\\{","end":"\\\\}","patterns":[{"include":"#groovy-code"}]},"class":{"begin":"(?=\\\\w?[\\\\w\\\\s]*(?:class|(?:@)?interface|enum)\\\\s+\\\\w+)","end":"}","endCaptures":{"0":{"name":"punctuation.section.class.end.groovy"}},"name":"meta.definition.class.groovy","patterns":[{"include":"#storage-modifiers"},{"include":"#comments"},{"captures":{"1":{"name":"storage.modifier.groovy"},"2":{"name":"entity.name.type.class.groovy"}},"match":"(class|(?:@)?interface|enum)\\\\s+(\\\\w+)","name":"meta.class.identifier.groovy"},{"begin":"extends","beginCaptures":{"0":{"name":"storage.modifier.extends.groovy"}},"end":"(?={|implements)","name":"meta.definition.class.inherited.classes.groovy","patterns":[{"include":"#object-types-inherited"},{"include":"#comments"}]},{"begin":"(implements)\\\\s","beginCaptures":{"1":{"name":"storage.modifier.implements.groovy"}},"end":"(?=\\\\s*extends|\\\\{)","name":"meta.definition.class.implemented.interfaces.groovy","patterns":[{"include":"#object-types-inherited"},{"include":"#comments"}]},{"begin":"{","end":"(?=})","name":"meta.class.body.groovy","patterns":[{"include":"#class-body"}]}]},"class-body":{"patterns":[{"include":"#enum-values"},{"include":"#constructors"},{"include":"#groovy"}]},"closures":{"begin":"\\\\{(?=.*?->)","end":"\\\\}","patterns":[{"begin":"(?<=\\\\{)(?=[^}]*?->)","end":"->","endCaptures":{"0":{"name":"keyword.operator.groovy"}},"patterns":[{"begin":"(?!->)","end":"(?=->)","name":"meta.closure.parameters.groovy","patterns":[{"begin":"(?!,|->)","end":"(?=,|->)","name":"meta.closure.parameter.groovy","patterns":[{"begin":"=","beginCaptures":{"0":{"name":"keyword.operator.assignment.groovy"}},"end":"(?=,|->)","name":"meta.parameter.default.groovy","patterns":[{"include":"#groovy-code"}]},{"include":"#parameters"}]}]}]},{"begin":"(?=[^}])","end":"(?=\\\\})","patterns":[{"include":"#groovy-code"}]}]},"comment-block":{"begin":"/\\\\*","captures":{"0":{"name":"punctuation.definition.comment.groovy"}},"end":"\\\\*/","name":"comment.block.groovy"},"comments":{"patterns":[{"captures":{"0":{"name":"punctuation.definition.comment.groovy"}},"match":"/\\\\*\\\\*/","name":"comment.block.empty.groovy"},{"include":"text.html.javadoc"},{"include":"#comment-block"},{"captures":{"1":{"name":"punctuation.definition.comment.groovy"}},"match":"(//).*$\\\\n?","name":"comment.line.double-slash.groovy"}]},"constants":{"patterns":[{"match":"\\\\b([A-Z][A-Z0-9_]+)\\\\b","name":"constant.other.groovy"},{"match":"\\\\b(true|false|null)\\\\b","name":"constant.language.groovy"}]},"constructors":{"applyEndPatternLast":1,"begin":"(?<=;|^)(?=\\\\s*(?:(?:private|protected|public|native|synchronized|abstract|threadsafe|transient|static|final)\\\\s+)*[A-Z]\\\\w*\\\\()","end":"}","patterns":[{"include":"#method-content"}]},"enum-values":{"patterns":[{"begin":"(?<=;|^)\\\\s*\\\\b([A-Z0-9_]+)(?=\\\\s*(?:,|;|}|\\\\(|$))","beginCaptures":{"1":{"name":"constant.enum.name.groovy"}},"end":",|;|(?=})|^(?!\\\\s*\\\\w+\\\\s*(?:,|$))","patterns":[{"begin":"\\\\(","end":"\\\\)","name":"meta.enum.value.groovy","patterns":[{"match":",","name":"punctuation.definition.seperator.parameter.groovy"},{"include":"#groovy-code"}]}]}]},"groovy":{"patterns":[{"include":"#comments"},{"include":"#class"},{"include":"#variables"},{"include":"#methods"},{"include":"#annotations"},{"include":"#groovy-code"}]},"groovy-code":{"patterns":[{"include":"#groovy-code-minus-map-keys"},{"include":"#map-keys"}]},"groovy-code-minus-map-keys":{"comment":"In some situations, maps can\'t be declared without enclosing []\'s, \\n\\t\\t\\t\\ttherefore we create a collection of everything but that","patterns":[{"include":"#comments"},{"include":"#annotations"},{"include":"#support-functions"},{"include":"#keyword-language"},{"include":"#values"},{"include":"#anonymous-classes-and-new"},{"include":"#keyword-operator"},{"include":"#types"},{"include":"#storage-modifiers"},{"include":"#parens"},{"include":"#closures"},{"include":"#braces"}]},"keyword":{"patterns":[{"include":"#keyword-operator"},{"include":"#keyword-language"}]},"keyword-language":{"patterns":[{"match":"\\\\b(try|catch|finally|throw)\\\\b","name":"keyword.control.exception.groovy"},{"match":"\\\\b((?<!\\\\.)(?:return|break|continue|default|do|while|for|switch|if|else))\\\\b","name":"keyword.control.groovy"},{"begin":"\\\\bcase\\\\b","beginCaptures":{"0":{"name":"keyword.control.groovy"}},"end":":","endCaptures":{"0":{"name":"punctuation.definition.case-terminator.groovy"}},"name":"meta.case.groovy","patterns":[{"include":"#groovy-code-minus-map-keys"}]},{"begin":"\\\\b(assert)\\\\s","beginCaptures":{"1":{"name":"keyword.control.assert.groovy"}},"end":"$|;|}","name":"meta.declaration.assertion.groovy","patterns":[{"match":":","name":"keyword.operator.assert.expression-seperator.groovy"},{"include":"#groovy-code-minus-map-keys"}]},{"match":"\\\\b(throws)\\\\b","name":"keyword.other.throws.groovy"}]},"keyword-operator":{"patterns":[{"match":"\\\\b(as)\\\\b","name":"keyword.operator.as.groovy"},{"match":"\\\\b(in)\\\\b","name":"keyword.operator.in.groovy"},{"match":"\\\\?:","name":"keyword.operator.elvis.groovy"},{"match":"\\\\*:","name":"keyword.operator.spreadmap.groovy"},{"match":"\\\\.\\\\.","name":"keyword.operator.range.groovy"},{"match":"->","name":"keyword.operator.arrow.groovy"},{"match":"<<","name":"keyword.operator.leftshift.groovy"},{"match":"(?<=\\\\S)\\\\.(?=\\\\S)","name":"keyword.operator.navigation.groovy"},{"match":"(?<=\\\\S)\\\\?\\\\.(?=\\\\S)","name":"keyword.operator.safe-navigation.groovy"},{"begin":"\\\\?","beginCaptures":{"0":{"name":"keyword.operator.ternary.groovy"}},"end":"(?=$|\\\\)|}|])","name":"meta.evaluation.ternary.groovy","patterns":[{"match":":","name":"keyword.operator.ternary.expression-seperator.groovy"},{"include":"#groovy-code-minus-map-keys"}]},{"match":"==~","name":"keyword.operator.match.groovy"},{"match":"=~","name":"keyword.operator.find.groovy"},{"match":"\\\\b(instanceof)\\\\b","name":"keyword.operator.instanceof.groovy"},{"match":"(===|==|!=|<=|>=|<=>|<>|<|>|<<)","name":"keyword.operator.comparison.groovy"},{"match":"=","name":"keyword.operator.assignment.groovy"},{"match":"(--|\\\\+\\\\+)","name":"keyword.operator.increment-decrement.groovy"},{"match":"(-|\\\\+|\\\\*|\\\\/|%)","name":"keyword.operator.arithmetic.groovy"},{"match":"(!|&&|\\\\|\\\\|)","name":"keyword.operator.logical.groovy"}]},"language-variables":{"patterns":[{"match":"\\\\b(this|super)\\\\b","name":"variable.language.groovy"}]},"map-keys":{"patterns":[{"captures":{"1":{"name":"constant.other.key.groovy"},"2":{"name":"punctuation.definition.seperator.key-value.groovy"}},"match":"(\\\\w+)\\\\s*(:)"}]},"method-call":{"begin":"([\\\\w$]+)(\\\\()","beginCaptures":{"1":{"name":"meta.method.groovy"},"2":{"name":"punctuation.definition.method-parameters.begin.groovy"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.method-parameters.end.groovy"}},"name":"meta.method-call.groovy","patterns":[{"match":",","name":"punctuation.definition.seperator.parameter.groovy"},{"include":"#groovy-code"}]},"method-content":{"patterns":[{"match":"\\\\s"},{"include":"#annotations"},{"begin":"(?=(?:\\\\w|<)[^(]*\\\\s+(?:[\\\\w$]|<)+\\\\s*\\\\()","end":"(?=[\\\\w$]+\\\\s*\\\\()","name":"meta.method.return-type.java","patterns":[{"include":"#storage-modifiers"},{"include":"#types"}]},{"begin":"([\\\\w$]+)\\\\s*\\\\(","beginCaptures":{"1":{"name":"entity.name.function.java"}},"end":"\\\\)","name":"meta.definition.method.signature.java","patterns":[{"begin":"(?=[^)])","end":"(?=\\\\))","name":"meta.method.parameters.groovy","patterns":[{"begin":"(?=[^,)])","end":"(?=,|\\\\))","name":"meta.method.parameter.groovy","patterns":[{"match":",","name":"punctuation.definition.separator.groovy"},{"begin":"=","beginCaptures":{"0":{"name":"keyword.operator.assignment.groovy"}},"end":"(?=,|\\\\))","name":"meta.parameter.default.groovy","patterns":[{"include":"#groovy-code"}]},{"include":"#parameters"}]}]}]},{"begin":"(?=<)","end":"(?=\\\\s)","name":"meta.method.paramerised-type.groovy","patterns":[{"begin":"<","end":">","name":"storage.type.parameters.groovy","patterns":[{"include":"#types"},{"match":",","name":"punctuation.definition.seperator.groovy"}]}]},{"begin":"throws","beginCaptures":{"0":{"name":"storage.modifier.groovy"}},"end":"(?={|;)|^(?=\\\\s*(?:[^{\\\\s]|$))","name":"meta.throwables.groovy","patterns":[{"include":"#object-types"}]},{"begin":"{","end":"(?=})","name":"meta.method.body.java","patterns":[{"include":"#groovy-code"}]}]},"methods":{"applyEndPatternLast":1,"begin":"(?:(?<=;|^|{)(?=\\\\s*(?:(?:private|protected|public|native|synchronized|abstract|threadsafe|transient|static|final)|(?:def)|(?:(?:(?:void|boolean|byte|char|short|int|float|long|double)|(?:@?(?:[a-zA-Z]\\\\w*\\\\.)*[A-Z]+\\\\w*))[\\\\[\\\\]]*(?:<.*>)?))\\\\s+([^=]+\\\\s+)?\\\\w+\\\\s*\\\\())","end":"}|(?=[^{])","name":"meta.definition.method.groovy","patterns":[{"include":"#method-content"}]},"nest_curly":{"begin":"\\\\{","captures":{"0":{"name":"punctuation.section.scope.groovy"}},"end":"\\\\}","patterns":[{"include":"#nest_curly"}]},"numbers":{"patterns":[{"match":"((0(x|X)[0-9a-fA-F]*)|(\\\\+|-)?\\\\b((\\\\d+\\\\.?\\\\d*)|(\\\\.\\\\d+))((e|E)(\\\\+|-)?\\\\d+)?)([LlFfUuDdg]|UL|ul)?\\\\b","name":"constant.numeric.groovy"}]},"object-types":{"patterns":[{"begin":"\\\\b((?:[a-z]\\\\w*\\\\.)*(?:[A-Z]+\\\\w*[a-z]+\\\\w*|UR[LI]))<","end":">|[^\\\\w\\\\s,?<\\\\[\\\\]]","name":"storage.type.generic.groovy","patterns":[{"include":"#object-types"},{"begin":"<","comment":"This is just to support <>\'s with no actual type prefix","end":">|[^\\\\w\\\\s,\\\\[\\\\]<]","name":"storage.type.generic.groovy"}]},{"begin":"\\\\b((?:[a-z]\\\\w*\\\\.)*[A-Z]+\\\\w*[a-z]+\\\\w*)(?=\\\\[)","end":"(?=[^\\\\]\\\\s])","name":"storage.type.object.array.groovy","patterns":[{"begin":"\\\\[","end":"\\\\]","patterns":[{"include":"#groovy"}]}]},{"match":"\\\\b(?:[a-zA-Z]\\\\w*\\\\.)*(?:[A-Z]+\\\\w*[a-z]+\\\\w*|UR[LI])\\\\b","name":"storage.type.groovy"}]},"object-types-inherited":{"patterns":[{"begin":"\\\\b((?:[a-zA-Z]\\\\w*\\\\.)*[A-Z]+\\\\w*[a-z]+\\\\w*)<","end":">|[^\\\\w\\\\s,?<\\\\[\\\\]]","name":"entity.other.inherited-class.groovy","patterns":[{"include":"#object-types-inherited"},{"begin":"<","comment":"This is just to support <>\'s with no actual type prefix","end":">|[^\\\\w\\\\s,\\\\[\\\\]<]","name":"storage.type.generic.groovy"}]},{"captures":{"1":{"name":"keyword.operator.dereference.groovy"}},"match":"\\\\b(?:[a-zA-Z]\\\\w*(\\\\.))*[A-Z]+\\\\w*[a-z]+\\\\w*\\\\b","name":"entity.other.inherited-class.groovy"}]},"parameters":{"patterns":[{"include":"#annotations"},{"include":"#storage-modifiers"},{"include":"#types"},{"match":"\\\\w+","name":"variable.parameter.method.groovy"}]},"parens":{"begin":"\\\\(","end":"\\\\)","patterns":[{"include":"#groovy-code"}]},"primitive-arrays":{"patterns":[{"match":"\\\\b(?:void|boolean|byte|char|short|int|float|long|double)(\\\\[\\\\])*\\\\b","name":"storage.type.primitive.array.groovy"}]},"primitive-types":{"patterns":[{"match":"\\\\b(?:void|boolean|byte|char|short|int|float|long|double)\\\\b","name":"storage.type.primitive.groovy"}]},"regexp":{"patterns":[{"begin":"/(?=[^/]+/([^>]|$))","beginCaptures":{"0":{"name":"punctuation.definition.string.regexp.begin.groovy"}},"end":"/","endCaptures":{"0":{"name":"punctuation.definition.string.regexp.end.groovy"}},"name":"string.regexp.groovy","patterns":[{"match":"\\\\\\\\.","name":"constant.character.escape.groovy"}]},{"begin":"~\\"","beginCaptures":{"0":{"name":"punctuation.definition.string.regexp.begin.groovy"}},"end":"\\"","endCaptures":{"0":{"name":"punctuation.definition.string.regexp.end.groovy"}},"name":"string.regexp.compiled.groovy","patterns":[{"match":"\\\\\\\\.","name":"constant.character.escape.groovy"}]}]},"storage-modifiers":{"patterns":[{"match":"\\\\b(private|protected|public)\\\\b","name":"storage.modifier.access-control.groovy"},{"match":"\\\\b(static)\\\\b","name":"storage.modifier.static.groovy"},{"match":"\\\\b(final)\\\\b","name":"storage.modifier.final.groovy"},{"match":"\\\\b(native|synchronized|abstract|threadsafe|transient)\\\\b","name":"storage.modifier.other.groovy"}]},"string-quoted-double":{"begin":"\\"","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.groovy"}},"end":"\\"","endCaptures":{"0":{"name":"punctuation.definition.string.end.groovy"}},"name":"string.quoted.double.groovy","patterns":[{"include":"#string-quoted-double-contents"}]},"string-quoted-double-contents":{"patterns":[{"match":"\\\\\\\\.","name":"constant.character.escape.groovy"},{"applyEndPatternLast":1,"begin":"\\\\$\\\\w","end":"(?=\\\\W)","name":"variable.other.interpolated.groovy","patterns":[{"match":"\\\\w","name":"variable.other.interpolated.groovy"},{"match":"\\\\.","name":"keyword.other.dereference.groovy"}]},{"begin":"\\\\$\\\\{","captures":{"0":{"name":"punctuation.section.embedded.groovy"}},"end":"\\\\}","name":"source.groovy.embedded.source","patterns":[{"include":"#nest_curly"}]}]},"string-quoted-double-multiline":{"begin":"\\"\\"\\"","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.groovy"}},"end":"\\"\\"\\"","endCaptures":{"0":{"name":"punctuation.definition.string.end.groovy"}},"name":"string.quoted.double.multiline.groovy","patterns":[{"include":"#string-quoted-double-contents"}]},"string-quoted-single":{"begin":"\'","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.groovy"}},"end":"\'","endCaptures":{"0":{"name":"punctuation.definition.string.end.groovy"}},"name":"string.quoted.single.groovy","patterns":[{"include":"#string-quoted-single-contents"}]},"string-quoted-single-contents":{"patterns":[{"match":"\\\\\\\\.","name":"constant.character.escape.groovy"}]},"string-quoted-single-multiline":{"begin":"\'\'\'","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.groovy"}},"end":"\'\'\'","endCaptures":{"0":{"name":"punctuation.definition.string.end.groovy"}},"name":"string.quoted.single.multiline.groovy","patterns":[{"include":"#string-quoted-single-contents"}]},"strings":{"patterns":[{"include":"#string-quoted-double-multiline"},{"include":"#string-quoted-single-multiline"},{"include":"#string-quoted-double"},{"include":"#string-quoted-single"},{"include":"#regexp"}]},"structures":{"begin":"\\\\[","beginCaptures":{"0":{"name":"punctuation.definition.structure.begin.groovy"}},"end":"\\\\]","endCaptures":{"0":{"name":"punctuation.definition.structure.end.groovy"}},"name":"meta.structure.groovy","patterns":[{"include":"#groovy-code"},{"match":",","name":"punctuation.definition.separator.groovy"}]},"support-functions":{"patterns":[{"match":"\\\\b(?:sprintf|print(?:f|ln)?)\\\\b","name":"support.function.print.groovy"},{"match":"\\\\b(?:shouldFail|fail(?:NotEquals)?|ass(?:ume|ert(?:S(?:cript|ame)|N(?:ot(?:Same|Null)|ull)|Contains|T(?:hat|oString|rue)|Inspect|Equals|False|Length|ArrayEquals)))\\\\b","name":"support.function.testing.groovy"}]},"types":{"patterns":[{"match":"\\\\b(def)\\\\b","name":"storage.type.def.groovy"},{"include":"#primitive-types"},{"include":"#primitive-arrays"},{"include":"#object-types"}]},"values":{"patterns":[{"include":"#language-variables"},{"include":"#strings"},{"include":"#numbers"},{"include":"#constants"},{"include":"#types"},{"include":"#structures"},{"include":"#method-call"}]},"variables":{"applyEndPatternLast":1,"patterns":[{"begin":"(?:(?=(?:(?:private|protected|public|native|synchronized|abstract|threadsafe|transient|static|final)|(?:def)|(?:void|boolean|byte|char|short|int|float|long|double)|(?:(?:[a-z]\\\\w*\\\\.)*[A-Z]+\\\\w*))\\\\s+[\\\\w\\\\d_<>\\\\[\\\\],\\\\s]+(?:=|$)))","end":";|$","name":"meta.definition.variable.groovy","patterns":[{"match":"\\\\s"},{"captures":{"1":{"name":"constant.variable.groovy"}},"match":"([A-Z_0-9]+)\\\\s+(?==)"},{"captures":{"1":{"name":"meta.definition.variable.name.groovy"}},"match":"(\\\\w[^\\\\s,]*)\\\\s+(?==)"},{"begin":"=","beginCaptures":{"0":{"name":"keyword.operator.assignment.groovy"}},"end":"$","patterns":[{"include":"#groovy-code"}]},{"captures":{"1":{"name":"meta.definition.variable.name.groovy"}},"match":"(\\\\w[^\\\\s=]*)(?=\\\\s*($|;))"},{"include":"#groovy-code"}]}]}},"scopeName":"source.groovy"}'))]}}]);
//# sourceMappingURL=9880.edbf86012437bbef.js.map