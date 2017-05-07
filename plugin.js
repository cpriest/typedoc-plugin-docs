var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "typedoc/dist/lib/models/reflections/abstract", "typedoc/dist/lib/converter/components", "typedoc/dist/lib/converter/converter", "typedoc/dist/lib/converter/plugins/CommentPlugin", "typedoc/dist/lib/converter/factories/comment"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const abstract_1 = require("typedoc/dist/lib/models/reflections/abstract");
    const components_1 = require("typedoc/dist/lib/converter/components");
    const converter_1 = require("typedoc/dist/lib/converter/converter");
    const CommentPlugin_1 = require("typedoc/dist/lib/converter/plugins/CommentPlugin");
    const comment_1 = require("typedoc/dist/lib/converter/factories/comment");
    /************************************************
     * Where I'm At:
     *
     * 	- onDeclaration is loading things fine, onBeginResolve is also being called
     * 	- @doc-Title is being read and over-rides the name on reflection
     *
     * 	- Trying: to get the order of the Guides in the proper order
     * 		- Trying: to get typedoc.js of hain-docs/typedoc to work properly
     * 			- So that: I can launch typedoc from the command line (or via gulp)
     * 				- So that: I can launch typedoc in PhpStorm debugger and inspect
     * 					The enormous amount of data that typedoc produces to see if
     * 					there is a way to preserve order of Guides
     * 		- Good info found so far by searching github:
     *           https://github.com/search?utf8=%E2%9C%93&q=filename%3Atypedoc.js+theme&type=Code
     *
     * 	TODO:
     * 		- @doc-* tags to be removed (does not work in onDeclaration, probably works in onBeginResolve)
     * 		- Eliminate Globals
     * 		- Fixup CSS for Guides, pretty compact, need some room
     * 		- Eliminate legend on Guides pages?
     * 		- Show complete Primary Nav tree
     * 		- Icon for Guides to something else
     *
     */
    /**
     */
    let DocsPlugin = class DocsPlugin extends components_1.ConverterComponent {
        initialize() {
            console.log('initializing');
            this.listenTo(this.owner, {
                [converter_1.Converter.EVENT_BEGIN]: this.onBegin,
                [converter_1.Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
                [converter_1.Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
            });
        }
        /**
         * Triggered when the converter begins converting a project.
         *
         * @param context  The context object describing the current state the converter is in.
         */
        onBegin(context) {
            this.moduleRenames = [];
        }
        /**
         * Triggered when the converter has created a declaration reflection.
         *
         * @param context  The context object describing the current state the converter is in.
         * @param reflection  The reflection that is currently processed.
         * @param node  The node that is currently processed if available.
         */
        onDeclaration(context, reflection, node) {
            // console.log(`Reflection.name = ${reflection.name}`);
            if (!reflection.kindOf(abstract_1.ReflectionKind.Module))
                return;
            console.log(reflection.name);
            if (reflection.name == 'Plugin_Skeleton')
                console.log(reflection);
            let comment, matches;
            if (!(comment = comment_1.getRawComment(node)))
                return;
            if (!(matches = comment.match(/@doc-(\w+)\s*(.*)$/gm)))
                return;
            for (let match of matches) {
                let [, name, value] = match.match(/@doc-(\w+)\s*(.*)$/);
                switch (name.toLowerCase()) {
                    case 'title':
                        reflection.name = value;
                        break;
                    case 'type':
                        break;
                }
                // comment = comment.replace(new RegExp('/^.+@doc-' + name + '.+$/m'), '');
            }
            // console.log(comment);
            // reflection.comment = comment;
            // console.log(matches);
            // if (match) {
            //   // Look for @preferred
            //   let preferred = /@preferred/.exec(comment);
            //   // Set up a list of renames operations to perform when the resolve phase starts
            //   this.moduleRenames.push({
            //     renameTo: match[1],
            //     preferred: preferred != null,
            //     reflection: <ContainerReflection> reflection
            //   });
            // }
            // }
            // CommentPlugin.removeTags(reflection.comment, 'module');
            // CommentPlugin.removeTags(reflection.comment, 'preferred');
        }
        /**
         * Triggered when the converter begins resolving a project.
         *
         * @param context  The context object describing the current state the converter is in.
         */
        onBeginResolve(context) {
            let projRefs = context.project.reflections;
            let refsArray = Object.keys(projRefs).reduce((m, k) => {
                m.push(projRefs[k]);
                return m;
            }, []);
            // console.log(refsArray);
            // Process each rename
            this.moduleRenames.forEach(item => {
                let renaming = item.reflection;
                // Find an existing module that already has the "rename to" name.  Use it as the merge target.
                let mergeTarget = refsArray.filter(ref => ref.kind === renaming.kind && ref.name === item.renameTo)[0];
                // If there wasn't a merge target, just change the name of the current module and exit.
                if (!mergeTarget) {
                    renaming.name = item.renameTo;
                    return;
                }
                if (!mergeTarget.children) {
                    mergeTarget.children = [];
                }
                // Since there is a merge target, relocate all the renaming module's children to the mergeTarget.
                let childrenOfRenamed = refsArray.filter(ref => ref.parent === renaming);
                childrenOfRenamed.forEach((ref) => {
                    // update links in both directions
                    ref.parent = mergeTarget;
                    mergeTarget.children.push(ref);
                });
                // If @preferred was found on the current item, update the mergeTarget's comment
                // with comment from the renaming module
                if (item.preferred)
                    mergeTarget.comment = renaming.comment;
                // Now that all the children have been relocated to the mergeTarget, delete the empty module
                // Make sure the module being renamed doesn't have children, or they will be deleted
                if (renaming.children)
                    renaming.children.length = 0;
                CommentPlugin_1.CommentPlugin.removeReflection(context.project, renaming);
                // Remove @module and @preferred from the comment, if found.
                CommentPlugin_1.CommentPlugin.removeTags(mergeTarget.comment, "module");
                CommentPlugin_1.CommentPlugin.removeTags(mergeTarget.comment, "preferred");
            });
        }
    };
    DocsPlugin = __decorate([
        components_1.Component({ name: 'docs' })
    ], DocsPlugin);
    exports.DocsPlugin = DocsPlugin;
});
