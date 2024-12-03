// import { isValidObjectId } from "mongoose";
import { ObjectId } from "mongodb";
// import validator from "validator";

const exportedMethods = {
  isValidObjectId(id){
    if (!id) throw 'You must provide an id to search for';
    if (typeof id !== 'string') throw 'Id must be a string';
    id = id.trim();
    if (id.length === 0) throw 'Id cannot be an empty string or just spaces';
    if (!ObjectId.isValid(id)) throw `Invalid ObjectId string: ${id}`;
  },
  // Validate name input
  validName(val) {
    return /^[a-zA-Z\s]+$/.test(val) && val.trim().length > 0;
  },

  isValidString(val, argument, routeOrFunction) {
    if (typeof val !== "string" || !val || val.trim().length === 0) {
      throw new Error(
        `${val} as ${argument} is not a valid string in the ${routeOrFunction}.`
      );
    }
    return val.trim();
  },

  // repair specific object array validation
  isValidObjectArray(val, argument, routeOrFunction){
    if(!Array.isArray(val)) throw `${argument} parameter must be an an array in the ${routeOrFunction} function`;
    if(val.length===0) throw `${argument} parameter should have at least one object in the array in the ${routeOrFunction} function`;

    for (let value of val){
      if(typeof value!=='object' || Array.isArray(value)) throw `Each element in the ${argument} array must be an object in the ${routeOrFunction} function`;
    
      if(Object.keys(value).length===0) throw `The object in the ${argument} array cannot be empty in the ${routeOrFunction} function`;

      // const keys=['modelName','repairTypes'];
      
      // if (!keys.every(key => key in value)) throw `Each object in the Models array must contain two keys: modelName, repairTypes`;

      const { modelName, repairTypes} = value;
      
      if (typeof modelName!=='string' || modelName.trim().length===0) throw `modelName must be a valid non-empty string in ${routeOrFunction} function`;

      // let valueRepair = val[modelName];
      // valueRepair=valueRepair.trim();
      // if (typeof value[modelName]!=='string' || value.length===0) throw `The value for modelName must be a valid, non-empty string`;

      // repairTypes array
      if(!Array.isArray(repairTypes)) throw `repairTypes parameter must be an array in the ${routeOrFunction} function`;
      if(repairTypes.length===0) throw `repairTypes parameter should have at least one object in the array in the ${routeOrFunction} function`;

      for (let repairType of repairTypes){
        if(typeof repairType!=='object' || Array.isArray(repairType)) throw `Each element in the repair types array must be an object`;
        // if(Object.keys(repairType).length===0) throw `the object in the repair type array cannot be empty`;
    
        // const keys=['repairName','defectiveParts','associatedPrice','estimatedTime'];
        
        // if (!keys.every(key => key in repairType)) throw `Each object in the repair Type array must contain four  keys: 'repairName','defectiveParts','associatedPrice','estimatedTime'`;
    
        const { repairName,defectiveParts,associatedPrice,estimatedTime } = repairType;
        
        if (typeof repairName!=='string' || firstName.trim().length===0) throw `repairName must be a valid, non-empty string`;
        // if (!Array.isArray(defectiveParts) || defectiveParts.some((part) => typeof part !== "string" || part.trim().length === 0))
          // throw `defectiveParts must be an array of non-empty strings`;
        this.isValidStringArray(defectiveParts,"defectiveParts",routeOrFunction);
        if (typeof associatedPrice!=='number' || isNaN(associatedPrice)) throw `associatedPrice must be a positive number`;
        if (typeof estimatedTime!=='number' || isNaN(estimatedTime)) throw `estimatedTime must be a positive number`;
      }
    }    
  },

  isValidStringArray(val,argument, routeOrFunction){
    if (!Array.isArray(val)) throw `${argument} must be an array in ${routeOrFunction}`;
    if (val.some((item) => typeof item !== "string" || item.trim().length === 0)) 
      throw `${argument} must only contain non-empty strings in ${routeOrFunction}`;
    return val.map((item) => item.trim());
  },

  isValidNumber(val, argument, routeOrFunction){
    if (typeof val !== "number" || isNaN(val) || val <= 0) throw `${argument} must be a positive number in ${routeOrFunction}`;
    return val;
  },
};

export default exportedMethods;
