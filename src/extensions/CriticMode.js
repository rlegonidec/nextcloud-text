import {
    Extension,
    Mark,
    markInputRule,
    markPasteRule,
    mergeAttributes,
} from '@tiptap/core'


export const INSERTION_CRITIC_START_MARK = "{++"
export const INSERTION_CRITIC_END_MARK = "++}"
export const INSERTION_INPUT_REGEX = /(?:\{\+\+)((?:.|\s)+)(?:\+\+\})$/
export const INSERTION_PASTE_REGEX = /(?:\{\+\+)((?:.|\s)+)(?:\+\+\})/g

export const DELETION_CRITIC_START_MARK = "{--"
export const DELETION_CRITIC_END_MARK = "--}"
export const DELETION_INPUT_REGEX = /(?:\{\-\-)((?:.|\s)+)(?:\-\-\})$/
export const DELETION_PASTE_REGEX = /(?:\{\-\-)((?:.|\s)+)(?:\-\-\})/g


export const CriticInsertionMark = Mark.create({
    name: 'critic-insertion',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    parseHTML() {
        return [
            {
                tag: 'ins',
            },
        ]
    },
    renderHTML({ HTMLAttributes }) {
        return ['ins', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },
    addInputRules() {
        return [
            markInputRule({
                find: INSERTION_INPUT_REGEX,
                type: this.type,
            }),
        ]
    },
    addPasteRules() {
        return [
            markPasteRule({
                find: INSERTION_PASTE_REGEX,
                type: this.type,
            }),
        ]
    },
    toMarkdown: {
        open: INSERTION_CRITIC_START_MARK,
        close: INSERTION_CRITIC_END_MARK,
        mixable: true,
        expelEnclosingWhitespace: true,
    },
})


export const CriticDeletionMark = Mark.create({
    name: 'critic-deletion',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    parseHTML() {
        return [
            {
                tag: 'del',
            },
        ]
    },
    renderHTML({ HTMLAttributes }) {
        return ['del', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },
    addInputRules() {
        return [
            markInputRule({
                find: DELETION_INPUT_REGEX,
                type: this.type,
            }),
        ]
    },
    addPasteRules() {
        return [
            markPasteRule({
                find: DELETION_PASTE_REGEX,
                type: this.type,
            }),
        ]
    },
    toMarkdown: {
        open: DELETION_CRITIC_START_MARK,
        close: DELETION_CRITIC_END_MARK,
        mixable: true,
        expelEnclosingWhitespace: true,
    },
})


const CriticMode = Extension.create({
    addExtensions() {
        return [CriticInsertionMark, CriticDeletionMark]
    },
})

export default CriticMode
