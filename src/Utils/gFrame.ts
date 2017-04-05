//gFrame namespace: DOM selector function
export default class gFrame {

    constructor(selector){
        let selectors=selector.trim().split(' ');
        let result:any=document;//Overall
        for (let N=0;N<selectors.length;N++){
            let curSelector=selectors[N];
            let filter,filterIndex=curSelector.indexOf('[');
            if (filterIndex!=-1) {
                filter=curSelector.substring(filterIndex+1,curSelector.indexOf(']')).trim();
                curSelector=curSelector.substring(0,filterIndex);
            }
            if (curSelector.contains('#')) {
                let id=curSelector.split('#')[1];
                if (result.length) {
                    let _result=[];
                    for (let M=0;M<result.length;M++){
                        _result.push(result[M].getElementById(id));
                    }
                    result=_result;
                }
                else result=result.getElementById(id);
            }
            else {
                let TagName=curSelector.contains('.')?curSelector.split('.')[0]:curSelector;
                let [className,tagResult=null,classResult = null]=[curSelector.split('.')[1]];
                if (TagName){
                    if (result.length) {
                        let _result=[];
                        for (let M=0;M<result.length;M++){
                            _result=_result.concat(this.toArray(result[M].getElementsByTagName(TagName)));
                        }
                        tagResult=_result;
                    }
                    else tagResult=this.toArray(result.getElementsByTagName(TagName));
                }
                if (className){
                    if (result.length) {
                        let _result=[];
                        for (let M=0;M<result.length;M++){
                            _result=_result.concat(this.toArray(result[M].getElementsByClassName(className)));
                        }
                        classResult=_result;
                    }
                    else classResult=this.toArray(result.getElementsByClassName(className));
                }
                if (TagName && !className) result=tagResult;
                if (!TagName && className) result=classResult;
                if (TagName && className) {
                    //The intersection of tagResult and classResult
                    result=tagResult.filter(function(item){
                        return (classResult.indexOf(item)!=-1);
                    });
                }
            }
            //Apply filter
            if (filter){
                //Attribute value filter
                if (filter.indexOf('=')!=-1){
                    let attr=filter.split('=')[0];
                    let val=eval(filter.split('=')[1]);
                    result=result.filter(function(item){
                        return item.getAttribute(attr)==val;
                    });
                }
                //Has attribute filter
                else {
                    let attr=filter;
                    result=result.filter(function(item){
                        return item.getAttribute(attr)!=null;
                    });
                }
            }
        }
        return result;
    };

/**************** Add to _$ namespace *******************/

    requestAnimationFrame=requestAnimationFrame || webkitRequestAnimationFrame ||
    mozRequestAnimationFrame || msRequestAnimationFrame || oRequestAnimationFrame;

    extends(fathers,addInObject){
    //Create child self as constructor function
    let child=function(props){
        if (fathers instanceof Array){
            const myself=this;
            fathers.forEach(function(father){
                father.call(myself,props);
            });
            //Add new into child constructor
            addInObject.constructorPlus.call(this,props);
        }
        else throw('_$.extends need array type parameter fathers!');
    };
    if (fathers.length>0){
        let mixinProto=fathers[0].prototype;
        for (var N=1;N<fathers.length;N++){
            //Mixin interfaces
            mixinProto=this.delegate(mixinProto,fathers[N].prototype);
            //Still instanceof interface == false
            mixinProto.constructor=fathers[N];
        }
        child.prototype= this.delegate(mixinProto,addInObject.prototypePlus);
        child.prototype.constructor=child;
    }
    else {
        //Original method
        for (let attr in addInObject.prototypePlus){
            child.prototype[attr]=addInObject.prototypePlus[attr];
        }
    }
    return child;
};

//_$.mixin == $.extend
    mixin(...args){
    switch (args.length){
        case 0:
            return {};
        default:
            let [dist,...addIns]=args;
            addIns.forEach(addIn=>{
                Object.assign(dist,addIn);
            });
            return dist;
    }
};
//Can only copy one level, copy reference
    copy(obj){
    //Auto detect obj/array
    return this.mixin(new obj.constructor(),obj);
};
//Full traverse copy, copy one level when ref=true
    clone(obj,ref?){
    //Auto detect obj/array
    let dist=new obj.constructor();
    for (let attr in obj){
        //Cannot just assign pointer if it's object type
        if (typeof(obj[attr])=="object" && !ref) {
            dist[attr]=this.clone(obj[attr]);
        }
        //Can only assign simple type(number/boolean/string)
        else dist[attr]=obj[attr];
        //dist[attr]=(typeof(obj[attr])=="object")?_$.clone(obj[attr]):obj[attr];
    }
    return dist;
};

//Template
    templates = {
        src:{},
    //register ?id as ?tempStr
    register:function(id,tempStr){
        let tempObj: any={};
        tempObj.tempStr=tempStr;
        //Auto search for params
        tempObj.params=tempStr.match(/\${2}\w{1,}\${2}/g);// /RegExp/go,NoStop
        this.templates.src[id]=tempObj;
    },
    //apply template ?id with ?values
    applyOn:function(id,values) {
        let valueArray=[].concat(values);//Convert to array
        let src=this.templates.src[id];//Get src template object
        let result=src.tempStr;//Get original template
        for (let N=0;N<Math.min(valueArray.length,src.params.length);N++){
            result=result.replace(src.params[N],valueArray[N]);
        }
        return result;
    }
};

    traverse(obj,func){
    for (let attr in obj){
        if (typeof(obj[attr])=="object"){
            this.traverse(obj[attr],func);
        }
        else {
            //Callback
            func(obj[attr]);
        }
    }
};

    matrixOperation=function(matrix,operation){
    for (let attr in matrix){
        if (typeof(matrix[attr])=="object"){//array or object
            this.matrixOperation(matrix[attr],operation);
        }
        else {
            matrix[attr]=operation(matrix[attr]);
        }
    }
};

//Map traverse for array
    mapTraverse=function(array,operation){
    let operationTraverse=function(n){
        if (n instanceof Array) return n.map(operationTraverse);
        else return operation(n);
    };
    return array.map(operationTraverse);
};

//Array equals array
    arrayEqual=function(arr1,arr2){
    if (arr1.length==arr2.length){
        for (let n=0;n<arr1.length;n++){
            //Content not same
            if (arr1[n]!=arr2[n]) return false;
        }
        return true;
    }
    //Length not same
    else return false;
};

/**********Dojo relative**********/
    modules={};
//Script loader
    SourceLoader={
    sources:new Map(),
    sourceNum:0,
    loadedNum:0,
    allLoaded:true,
    load:function(pathName){
        this.SourceLoader.sourceNum++;
        this.SourceLoader.allLoaded=false;
        //Type=="script"
        let node=document.createElement('script');
        var that = this;
        node.onload=function(){
            //Load builder
            that.modules[pathName]=that.define.loadedBuilders.shift();
            that.SourceLoader.loaded();
        };
        //Block this module, should not load again
        this.modules[pathName]=true;
        node.src=pathName+'.js';
        document.getElementsByTagName('head')[0].appendChild(node);
    },
    loaded:function(){
        this.SourceLoader.loadedNum++;
        if(this.SourceLoader.loadedNum==this.SourceLoader.sourceNum){
            this.SourceLoader.allLoaded=true;
        }
    },
    allOnLoad:function(callback=function(){}){
        if (this.SourceLoader.allLoaded) {
            callback();
        }
        else {
            setTimeout(function(){
                this.SourceLoader.allOnLoad(callback);
            },100);
        }
    }
};
//Async instantiate
    instModule=function(name){
        if (this.instModule.refStack == null) {
            this.instModule.refStack=[];
        }
        //Add module instantiate stack
        this.instModule.refStack.push(name);
        //Instantiate module constructor
        let module=this.modules[name];
        //Now instantiate builder function
        if (module._$isBuilder){
            let refObjs=[];
            if (module.refArr) {
                module.refArr.forEach(function(ref){
                    //Recursion instantiate
                    if (ref[0]=='=') {
                        //Closure
                        let loc=ref.substr(1);
                        refObjs.push(function(){
                            return this.modules[loc];
                        });
                    }
                    else {
                        if (this.instModule.refStack.indexOf(ref)!=-1) {
                            //Auto detect loop reference
                            throw `Loop reference found: ${name} --> ${ref}`;
                        }
                        refObjs.push(this.instModule(ref));
                    }
                });
            }
            //Override module function with instance
            this.modules[name]=module.apply(window,refObjs);
        }
        this.instModule.refStack.pop();
        return this.modules[name];
};

//Register module builder function into _$.modules
    define=function(refArr,builderFunc){

        refArr.forEach(function(ref){
            if (ref[0]=='=') return;
            //Recursion loading if that module not loaded
            if (!this.modules[ref]) this.SourceLoader.load(ref);
        });
        //Builder loaded
        builderFunc.refArr=refArr;
        builderFunc._$isBuilder=true;
        if (this.define.loadedBuilders== null) {
            this.define.loadedBuilders=[];
        }
        this.define.loadedBuilders.push(builderFunc);
        //_$.modules[pathName]=builderFunc;
    };


//Run callback functions with module references
    require=function(refArr,callback=()=>{}){
    refArr.forEach(function(ref){
        if (ref[0]=='=') return;
        //Recursion loading if that module not loaded
        if (!this.modules[ref]) this.SourceLoader.load(ref);
    });
    this.SourceLoader.allOnLoad(function(){
        let refObjs=[];
        refArr.forEach(function(ref){
            //Recursion instantiate
            refObjs.push(this.instModule(ref));
        });
        callback.apply(window,refObjs);
    });
};
//Constructor extension: changed to multiple inherit
    declare=function(globalName,fathers,plusObj){
    if (arguments.length==2){
        plusObj=fathers;
        fathers=globalName;
        globalName=null;
    }
    if (!fathers) fathers=[];
    let constructPlus=plusObj.constructor;
    delete plusObj.constructor;
    let protoPlus=plusObj;
    let child=this.extends(fathers,{constructorPlus:constructPlus,prototypePlus:protoPlus});
    if (globalName) window[globalName]=child;
    return child;
};

//Publish & Subscribe topic
    topic={};
    subscribe=function(topic,callback){
    if (!this.topic[topic])this.topic[topic]={callbacks:[]};
    this.topic[topic].callbacks.push(callback);
};
//Need add .owner on callback to identify who is subscriber
    unSubscribe=function(topic,callback){
    if (this.topic[topic] && this.topic[topic].callbacks){
        let index=this.topic[topic].callbacks.indexOf(callback);
        this.topic[topic].callbacks.splice(index,1);
    }
};
    publish=function(topic,msgObj){
    if (this.topic[topic]){
        this.topic[topic].callbacks.forEach(function(callback){
            callback.call(window,msgObj);
        })
    }
};

//lang.delegate:cover with one proto layer
    delegate=function(chara,bufferObj){
    let func=function(){};
    func.prototype=chara;
    return this.mixin(new func(),bufferObj);
};

//lang.hitch:bind context this with function
    hitch=function(func,thisP){
    //Higher-order function: compress this pointer into closure here
    return function() {
        func.apply(thisP,arguments);
    };
};

//Convert array-like to real array
    toArray=function(arr){
    let result=[];
    for (let N=0;N<arr.length;N++){
        result.push(arr[N]);
    }
    return result;
};

//Backup for name collision
    Map=Map;


//Extension for ES6 class extends
    protoProps= (Symbol as any).for("protoProps");
    levelUpProps=(Symbol as any).for('levelUpProps');
//Decorator: @classPatch
    classPatch=function(targetClass){
    if (targetClass[this.protoProps]){
        Object.assign(targetClass.prototype,targetClass[this.protoProps]());
        delete targetClass[this.protoProps];
    }
};
//Decorator: @classPackagePatch
    classPackagePatch=function(targetObj){
    for (let charaType of Object.keys(targetObj)){
        this.classPatch(targetObj[charaType]);
    }
};
}



(String.prototype as any).contains=function(str){
    return this.indexOf(str)!=-1;
};
Object.defineProperty(String.prototype,'contains',{enumerable:false});

let mozRequestAnimationFrame;
let msRequestAnimationFrame;
let oRequestAnimationFrame;
window.requestAnimationFrame=requestAnimationFrame || webkitRequestAnimationFrame ||
    mozRequestAnimationFrame || msRequestAnimationFrame || oRequestAnimationFrame;
/*window.cancelRequestAnimationFrame=cancelRequestAnimationFrame || webkitCancelRequestAnimationFrame ||
 mozCancelRequestAnimationFrame || msCancelRequestAnimationFrame || oCancelRequestAnimationFrame;*/

//Gobj is game object,initial by only one parameter props
(Function.prototype as any).extends=function(addInObject){
    //father call extends to produce child
    let father=this;
    //Create child self as constructor function
    let child : any =function(props){
        //If props==null, will throw errors during construction
        if (props){
            //Execute old constructor
            father.call(this,props);
            //Add new into child constructor
            addInObject.constructorPlus.call(this,props);//this.constructorPlus(props)
        }
    };
    //Inherit prototype from father, clear redundant properties inside father constructor
    /*//We don't need properties constructed by {}, constructor not changed;
     child.prototype.__proto__=father.prototype;//__proto__ isn't supported by IE9 and IE10, IE11 supports*/
    Object.setPrototypeOf(child.prototype,father.prototype);
    //Add new functions into child.prototype
    Object.assign(child.prototype,addInObject.prototypePlus);

    /*****Add super&inherited pointer for instance*****/
    //The upper constructor is super
    child.prototype.super=father;
    Object.defineProperty(child.prototype,'super',{enumerable:false});
    //Behaviors including constructor are inherited by child, can find depreciated
    child.prototype.inherited=father.prototype;//Behavior always in prototype
    Object.defineProperty(child.prototype,'inherited',{enumerable:false});
    /*****Generate super&inherited pointer link*****/
    child.super=father;
    Object.defineProperty(child,'super',{enumerable:false});
    child.inherited=father.prototype;
    Object.defineProperty(child,'inherited',{enumerable:false});

    return child;
};
Object.defineProperty(Function.prototype,'extends',{enumerable:false});

//Extend Audio
Audio.prototype.playFromStart=function(){
    this.pause();
    this.currentTime=0;
    this.play();
};
Object.defineProperty(Audio.prototype,'playFromStart',{enumerable:false});


//Extend Array
(Array as any).gen=function(N,start){
    if (start==null) start=0;
    let result=[];
    for (let n=start;n<(N+1);n++){
        result.push(n);
    }
    return result;
};
Object.defineProperty(Array,'gen',{enumerable:false});

(Array.prototype as any ).repeat=function(N,flag){
    let result=[];
    if (flag){
        for (let n=0;n<this.length;n++){
            result=result.concat(new Array(N).fill(this[n]));
        }
    }
    else {
        for (let n=0;n<N;n++){
            result=result.concat(this);
        }
    }
    return result;
};
Object.defineProperty(Array.prototype,'repeat',{enumerable:false});
(Array.prototype as any ).del=function(index,N){
    this.splice(index,N);
    return this;
};
Object.defineProperty(Array.prototype,'del',{enumerable:false});
(Array.prototype as any ).insert=function(index,arr){
    this.splice(index,0,...arr);
    return this;
};
Object.defineProperty(Array.prototype,'insert',{enumerable:false});
