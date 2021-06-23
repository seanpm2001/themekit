/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

var path = require('path'),
    chalk = require('chalk'),
    filterProperties = require('./filterProperties'),
    GroupMessages = require('./utils/groupMessages');

let fs
if (typeof window === 'undefined') {
	fs = require('fs-extra')
}

/**
 * Takes the style property object and a format and returns a
 * string that can be written to a file.
 * @memberOf StyleDictionary
 * @param {String} destination
 * @param {Function} format
 * @param {Object} platform
 * @param {Object} dictionary
 * @param {Function} filter
 * @returns {null}
 */
function buildFile(destination, format, platform, dictionary, filter) {
  if (typeof format !== 'function')
    throw new Error('Please enter a valid file format');
  if (typeof destination !== 'string')
    throw new Error('Please enter a valid destination');

  var fullDestination = destination;

  // if there is a build path, prepend the full destination with it
  if (platform.buildPath) {
    fullDestination = platform.buildPath + fullDestination;
  }

  var dirname = path.dirname(fullDestination);
  if (!fs.existsSync(dirname))
    fs.mkdirsSync(dirname);

  var filteredProperties = filterProperties(dictionary, filter);

  // Check for property name Collisions
  var nameCollisionObj = {};
  filteredProperties.allProperties && filteredProperties.allProperties.forEach((propertyData) => {
    let propertyName = propertyData.name;
    if(!nameCollisionObj[propertyName]) {
      nameCollisionObj[propertyName] = [];
    }
    nameCollisionObj[propertyName].push(propertyData);
  });

  var PROPERTY_NAME_COLLISION_WARNINGS = GroupMessages.GROUP.PropertyNameCollisionWarnings + ":" + destination;
  GroupMessages.clear(PROPERTY_NAME_COLLISION_WARNINGS);
  Object.keys(nameCollisionObj).forEach((propertyName) => {
    if(nameCollisionObj[propertyName].length > 1) {
      let collisions = nameCollisionObj[propertyName].map((properties) => {
        let propertyPathText = chalk.keyword('orangered')(properties.path.join('.'));
        let valueText = chalk.keyword('darkorange')(properties.value);
        return propertyPathText + '   ' + valueText;
      }).join('\n        ');
      GroupMessages.add(
        PROPERTY_NAME_COLLISION_WARNINGS,
        `Output name ${chalk.keyword('orangered').bold(propertyName)} was generated by:\n        ${collisions}`
      );
    }
  });

  let propertyNamesCollisionCount = GroupMessages.count(PROPERTY_NAME_COLLISION_WARNINGS);

  fs.writeFileSync(fullDestination, format(filteredProperties, platform));
  console.log((propertyNamesCollisionCount>0 ? '⚠️ ' : chalk.bold.green('✔︎ ')) + ' ' + fullDestination);

  if(propertyNamesCollisionCount > 0) {
    let propertyNamesCollisionWarnings = GroupMessages.fetchMessages(PROPERTY_NAME_COLLISION_WARNINGS).join('\n    ');
    let title = `While building ${chalk.keyword('orangered').bold(destination)}, token collisions were found; output may be unexpected.`;
    let help = chalk.keyword('orange')([
      'This many-to-one issue is usually caused by some combination of:',
          '* conflicting or similar paths/names in property definitions',
          '* platform transforms/transformGroups affecting names, especially when removing specificity',
          '* overly inclusive file filters',
    ].join('\n    '));
    let warn = `${title}\n    ${propertyNamesCollisionWarnings}\n${help}`;
    console.log(chalk.keyword('darkorange').bold(warn));
  }
}


module.exports = buildFile;
