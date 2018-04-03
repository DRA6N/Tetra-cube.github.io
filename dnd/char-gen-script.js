var character, books, subraceVariants;

function UpdateAllDropdowns()
{
	document.getElementById('gendermenu').innerHTML ='<option value="0">Random</option><option value="1">Male</option><option value="2">Female</option><option value="3">Nonbinary or Unknown</option>'
	
	SetDropdownOptions(races, 'racemenu');
	SetDropdownOptions(classes, 'classmenu');
	SetDropdownOptions(backgrounds, 'backgroundmenu');
}

function SetDropdownOptions(arr, id)
{
	GetBooks();
	var optionsArray = [ '<option value="0">Random</option>' ];
		optionsArray.push();
	for(var index in arr)
	{
		var item = arr[index];
		if(typeof item == 'object')
		{
			if(item.hasOwnProperty('_special'))
			{
				if(!CheckHasBook(GetBookString(item._special)))
					continue;
			}
		}
		optionsArray.push('<option value="' + (parseInt(index) + 1) + '">' + item._name + '</option>');
	}
	document.getElementById(id).innerHTML = optionsArray.join('');
}

function RandomizeAll()
{
	GetBooks();
	character = {};
	
	RandomizeGender(true);
	RandomizeRace(true);
	RandomizeClass(true);
	RandomizeBackground(true);
	RandomizeName(true);
	//RandomizeStats(true);
	RandomizeLife(true);
	
	MakeCard();
}

function RandomizeRace(allRandom)
{
	if(!allRandom)
		GetBooks();
	subraceVariants = [];
	character.Race = GetPropertiesStart(races, 'racemenu');
	SubraceVariantCheck();
	document.getElementById('race').innerHTML = character.Race._name;
	document.getElementById('raceheader').innerHTML = character.Race._name;
	document.getElementById('racesection').innerHTML = MakeHTMLString(character.Race);

	// Weird special case
	if(character.Race._name == 'Warforged')
	{
		character.Gender = 'Genderless Construct';
		document.getElementById('gender').innerHTML = character.Gender;
		return;
	}
	
	if(!allRandom)
	{
		RandomizeName(true);	// Randomizes both name and life
		MakeCard();
	}
}

function RandomizeClass(allRandom)
{
	if(!allRandom)
		GetBooks();
	character.Class = GetPropertiesStart(classes, 'classmenu');
	document.getElementById('class').innerHTML = character.Class._name;
	document.getElementById('classheader').innerHTML = character.Class._name;
	document.getElementById('classsection').innerHTML = MakeHTMLString(character.Class);
	if(!allRandom)
	{
		RandomizeLife(allRandom);
		MakeCard();
	}
}

function RandomizeBackground(allRandom)
{
	if(!allRandom)
		GetBooks();
	character.Background = GetPropertiesStart(backgrounds, 'backgroundmenu');
	document.getElementById('background').innerHTML = character.Background._name;
	document.getElementById('backgroundheader').innerHTML = character.Background._name;
	document.getElementById('backgroundsection').innerHTML = MakeHTMLString(character.Background);
	if(!allRandom)
	{
		RandomizeLife(allRandom);
		MakeCard();
	}
}

function RandomizeGender(allRandom)
{
	var genderMenu = document.getElementById('gendermenu'), index = parseInt(genderMenu.value) - 1;
	if(index < 0)
		character.Gender = RandomFromArray(genders);
	else
		character.Gender = genderMenu[genderMenu.selectedIndex].text;
	document.getElementById('gender').innerHTML = character.Gender;
}

function RandomizeName(allRandom)
{
	if(!allRandom)
		GetBooks();
	character._name = GetName(character.Race._name, character);
	document.getElementById('name').innerHTML = character._name;
	if(!allRandom)
	{
		RandomizeLife(allRandom);
		MakeCard();
	}
}

function RandomizeStats(allRandom)
{
	if(!allRandom)
		GetBooks();
	character.Stats = GetStats();
	document.getElementById('statssection').innerHTML = MakeHTMLString(character.Stats);
	if(!allRandom)
		MakeCard();
}

function RandomizeLife(allRandom)
{
	if(!allRandom)
		GetBooks();
	character.Life = Object.assign( { 'Trinket' : RandomFromArray(trinkets) }, GetProperties(life, true));
	FinishLife();
	document.getElementById('lifesection').innerHTML = MakeHTMLString(character.Life);
}

function GetBooks()
{
	books = [ 'PHB' ];
	for(var bookNum in availableBooks)
	{
		var book = availableBooks[bookNum];
		if(document.getElementById(book + 'box').checked)
			books.push(book);
	}
}

function GetPropertiesStart(propObj, dropdown)	// Set all properties in an object
{
	var index = parseInt(document.getElementById(dropdown).value) - 1;
	if(index < 0)
		index = RandomFromArrayCheckBooks(propObj);
	return GetProperties(propObj[index], true);
}

function GetProperties(propObj, allowSpecial)	// Set all properties in an object
{
	// Special case
	if(allowSpecial != false && propObj.hasOwnProperty('_special'))
		return SpecialCase(propObj, propObj._special)
	// String or number
	if(typeof propObj != 'object')
		return propObj;
	// Array
	if(Array.isArray(propObj))
		return GetProperties(propObj[RandomFromArrayCheckBooks(propObj)], true);
	// Another object
	var newPropObj = {};
	for(var propertyName in propObj)
	{
		if(propertyName != '_special')
			newPropObj[propertyName] = GetProperties(propObj[propertyName], true);
	}
	return newPropObj;
}

function MakeHTMLString(charObj)	// Make the content that shows up on the page
{
	var stringBuffer = [];
	for(var propertyName in charObj)
	{
		// Ignore certain properties
		if(propertyName == '_name')
			continue;
		var property = charObj[propertyName];
		if(property == '_none')
			continue;
		
		stringBuffer.push('<li>');
		if(propertyName.charAt(0) != '_')
			stringBuffer.push('<b>', propertyName, ':</b> ');
		if(typeof property == 'object')
			stringBuffer.push('<ul>', MakeHTMLString(property), '</ul>');
		else
		{
			// For tooltips
			while(property.indexOf('[[') >= 0)
			{
				var startIndex = property.indexOf('[['), lineIndex = property.indexOf('|'), endIndex = property.indexOf(']]');
				
				stringBuffer.push(
					property.substring(0, startIndex),
					'<span class="tooltip">',
					property.substring(startIndex + 2, lineIndex),
					'<span class="tooltiptext"> ',
					tooltips[property.substring(lineIndex + 1, endIndex)],
					'</span></span>');
				property = property.substring(endIndex + 2);
			}
			// For sub-properties
			
			if(property.indexOf('**') >= 0)
			{
				var starIndex = property.indexOf('**');
				stringBuffer.push(property.substring(0, starIndex), '<ul><li>');
				property = property.substring(starIndex + 2);
				starIndex = property.indexOf('**');
				while(starIndex >= 0)
				{
					stringBuffer.push(property.substring(0, starIndex), '</li><li>')
					property = property.substring(starIndex + 2);
					starIndex = property.indexOf('**');
				}
				stringBuffer.push(property, '</li></ul></li>');
			}
			else
				stringBuffer.push(property, '</li>');
		}
	}
	return stringBuffer.join('');
}

function SpecialCase(propObj, special)	// Weird stuff
{
	if(special.substring(0, 5) == 'book-')
	{
		if(special.indexOf(' ') < 0)
			return GetProperties(propObj, false);
		special = special.substring(special.indexOf(' ') + 1);
	}
	if (special.substring(0, 7) == "traits-")
		return BackgroundTraits(propObj, parseInt(special.substring(7)) - 1)
	switch(special)
	{
		// Pick from available sourcebooks
		case 'booksort' : 
			return GetProperties(RandomFromBookArray(propObj), true);
			
		// Compute characteristics for some races with subraces
		case 'characteristics' :
			return GetCharacteristics(propObj);
			
		// Get property according to gender
		case 'gendersort' :
			if(character.Gender == 'Male')
				return GetProperties(propObj.Male, true);
			if(character.Gender == 'Female')
				return GetProperties(propObj.Female, true);
			return GetProperties(propObj[RandomFromArray(['Male', 'Female'])], true);
			
		// For half-human races
		case 'halfethnicity' :
			if(RandomNum(5) > 0)
				return RandomEthnicity();
			return 'Unknown';
			
		// Determine parents, if a mixed race
		case 'mixedparents' :
			var parents = life.Origin.Parents;
			if(parents.hasOwnProperty(character.Race._name))
				return RandomFromArray(parents[character.Race._name]);
			return '_none';
			
		// Race stuff
		
		case 'subracetraitsort' :
			subraceVariants.push({ 'obj': propObj, 'propname' : 'Subrace', 'get' : 'trait' });
			return null;
		
		case 'subracephyssort' :
			subraceVariants.push({ 'obj': propObj, 'propname' : 'Subrace', 'get' : 'phys'  });
			return null;
		
		case 'draconicancestry' :
			subraceVariants.push({ 'obj': propObj, 'propname' : 'Draconic Ancestry', 'get' : 'trait' });
			return null;
		
		case 'dragonbornnickname' :
			return RandomFromArray(propObj._array);
		
		// Half-elf variant stuff from scag
		case 'halfelfvarianttraits' : 
			subraceVariants.push({ 'obj': propObj, 'propname' : 'Elven Ancestry', 'get' : 'halfelf' });
			return null;
		
		case 'halfelfvariantphys' : 
			subraceVariants.push({ 'obj': propObj, 'propname' : 'Elven Ancestry', 'get' : 'phys' });
			return null;
		
		case 'halforcsubraces' :
			return GetProperties(propObj, false);
		
		// Weird-looking tieflings
		case 'tieflingappearance' :
		if(RandomNum(3) == 0)
			return '_none';
		return RandomFromArrayMultiple(propObj._array, DiceRoll('1d4') + 1);
		
		// Variant tieflings from scag
		case 'tieflingvarianttype' :
			if(books.indexOf('SCAG') < 0)
				return '_none';
			return RandomFromArray(propObj._array);
		
		case 'tieflingvarianttraits' :
			subraceVariants.push({ 'obj': propObj, 'propname' : 'Variant', 'get' : 'tiefling' });
			return null;
		
		// Monster origins
		case 'monstrousorigin' :
			return RandomFromArray(monstrousOrigins);
		
		// Do this later
		case 'skip' :
			return '';
		
		// Do this never
		case 'ignoreinchargen' :
			return '_none';
	}
	return special;
}

// Work with the things we put off until everything else was done
function SubraceVariantCheck()
{
	for(var counter = 0; counter < subraceVariants.length; counter++)
	{
		var subraceVariant = subraceVariants[counter],
			subraceName = character.Race['Subraces and Variants'][subraceVariant.propname];
		if(subraceVariant.get == 'trait')
			character.Race['Racial Traits']['Subrace Traits'] = subraceVariant.obj[subraceName];
		else if(subraceVariant.get == 'phys')
			character.Race['Physical Characteristics'] = GetCharacteristics(subraceVariant.obj[subraceName]);
		else if(subraceVariant.get == 'halfelf')
		{
			character.Race['Racial Traits']['Variant Traits'] = '_none';
			if(books.indexOf('SCAG') < 0)
				continue;
			var variant = character.Race['Subraces and Variants']['Elven Ancestry'],
				variantTraits = Object.assign({}, subraceVariant.obj._list['_any'], subraceVariant.obj._list[variant]);
			character.Race['Racial Traits']['Variant Traits'] = variantTraits;
		}
		else if(subraceVariant.get == 'tiefling')
		{
			var variant = character.Race['Subraces and Variants'].Variant,
				variantTraitList = subraceVariant.obj._list;
			if(variant == '_none')
			{
				character.Race['Racial Traits']['Variant Traits'] = '_none';
				continue;
			}
			var variantTraits = {};
			for(var trait in variantTraitList)
			{
				if(variant.indexOf(trait) >= 0)
					variantTraits[trait] = (variantTraitList[trait]);
			}
			character.Race['Racial Traits']['Variant Traits'] = variantTraits;
		}
	}
}

function GetName(raceName, characterOrSib)
{
	switch(raceName)
	{
		case 'Aasimar' :
			return GetHumanName(GetHumanEthnicity(), characterOrSib.Gender);
		case 'Aarakocra' :
			return RandomFromArray(names.Aarakocra);
		case 'Bugbear' :
			return GetGenderedName(names.Bugbear, characterOrSib.Gender);
		case 'Changeling' :
			return RandomFromArray(names.Changeling);
		case 'Dragonborn' :
			return FirstnameLastname(names.Dragonborn, 'Clan', characterOrSib.Gender);
		case 'Dwarf' :
			return FirstnameLastname(names.Dwarf, 'Clan', characterOrSib.Gender);
		case 'Elf' :
			if(character.age < 80 + RandomNum(40))
				return RandomFromArray(names.Elf.Child) + ' ' + RandomFromArray(names.Elf.Family);
			return FirstnameLastname(names.Elf, 'Family', characterOrSib.Gender);
		case 'Firbolg' :
			return GetGenderedName(names.Elf, characterOrSib.Gender);
		case 'Genasi' :
			return GetHumanName(GetHumanEthnicity(), characterOrSib.Gender);
		case 'Gith' :
			return GetGenderedName(names.Gith, characterOrSib.Gender);
		case 'Gnome' :
			if(character.Race['Subraces and Variants'].Subrace == 'Deep Gnome')
				return FirstnameLastname(names['Deep Gnome'], 'Clan', characterOrSib.Gender);
			var firstNames, numNames = 4 + RandomNum(4);
			var gnomeNames = [];
			while(gnomeNames.length < numNames)
			{
				var item;
				if(characterOrSib.Gender == 'Male' || characterOrSib.Gender == 'Female')
					item = RandomFromArray(names.Gnome[characterOrSib.Gender]);
				else
					item = RandomFromArray(names.Gnome[RandomGender()]);
				if(gnomeNames.indexOf(item) < 0)
					gnomeNames.push(item);
			}
			firstNames = gnomeNames.join(' ');
			return firstNames + ' "' + RandomFromArray(names.Gnome.Nickname) + '" ' + RandomFromArray(names.Gnome.Clan);
		case 'Goblin' :
			return GetGenderedName(names.Goblin, characterOrSib.Gender)
		case 'Goliath' :
			return RandomFromArray(names.Goliath.Birth) + ' "' + RandomFromArray(names.Goliath.Nickname) + '" ' + RandomFromArray(names.Goliath.Clan);
		case 'Grung' :
			return RandomFromArray(names.Grung);
		case 'Halfling' :
			return FirstnameLastname(names.Halfling, 'Family', characterOrSib.Gender);
		case 'Half-Elf' :
			var rand = RandomNum(6)
			if(rand < 2)
				return HumanFirstName(GetHumanEthnicity(), characterOrSib.Gender) + ' ' + RandomFromArray(names.Elf.Family);
			if(rand < 4)
				return GetGenderedName(names.Elf, characterOrSib.Gender) + ' ' + HumanLastName(GetHumanEthnicity());
			if(rand < 5)
				return GetHumanName(GetHumanEthnicity(), characterOrSib.Gender);
			return FirstnameLastname(names.Elf, 'Family', characterOrSib.Gender);
		case 'Half-Orc' :
			var rand = RandomNum(4);
			if(rand < 1)
				return GetGenderedName(names.Orc, characterOrSib.Gender);
			if(rand < 2)
				return GetGenderedName(names.Orc, characterOrSib.Gender) + ' ' + HumanLastName(GetHumanEthnicity())
			return GetHumanName(GetHumanEthnicity(), characterOrSib.Gender);
		case 'Hobgoblin' :
			return FirstnameLastname(names.Hobgoblin, 'Clan', characterOrSib.Gender);
		case 'Human' :
			var ethnicity;
			if(character.Race._name == 'Human')
				ethnicity = character.Race['Subraces and Variants'].Ethnicity;
			else
				ethnicity = character.Race['Subraces and Variants']['Human Heritage'];
			if(ethnicity == 'Unknown')
				ethnicity = RandomEthnicity();
			return GetHumanName(ethnicity, characterOrSib.Gender);
		case 'Kenku' :
			return RandomFromArray(names.Kenku);
		case 'Kobold' :
			return GetGenderedName(names.Kobold, characterOrSib.Gender);
		case 'Lizardfolk' :
			return RandomFromArray(names.Lizardfolk);
		case 'Minotaur' :
			return GetGenderedName(names.Minotaur, characterOrSib.Gender);
		case 'Orc' :
			return GetGenderedName(names.Orc, characterOrSib.Gender);
		case 'Shifter' :
			return RandomFromArray([GetGenderedName(names.Shifter, characterOrSib.Gender), GetHumanName(RandomEthnicity(), characterOrSib.Gender)]);
		case 'Tabaxi' :
			return RandomFromArray(names.Tabaxi.Name) + ' ' + RandomFromArray(names.Tabaxi.Clan);
		case 'Tortle' :
			return RandomFromArray(names.Tortle);
		case 'Triton' :
			return FirstnameLastname(names.Triton, 'Surname', characterOrSib.Gender);
		case 'Tiefling' :
			if(RandomNum(5) < 2)
				return GetHumanName(GetHumanEthnicity(), characterOrSib.Gender);
			var lastName = HumanLastName(GetHumanEthnicity());
			if(characterOrSib.Gender == 'Male' || characterOrSib.Gender == 'Female')
			{
				if(RandomNum(3) == 0)
					return GetGenderedName(names.Infernal, characterOrSib.Gender) + ' ' + lastName;
				return RandomFromArray(names.Virtue) + ' ' + lastName;
			}
			if(RandomNum(3) > 0)
				return RandomFromArray(names.Virtue) + ' ' + lastName;
			return GetGenderedName(names.Infernal, characterOrSib.Gender) + ' ' + lastName;
		case 'Warforged' :
			return RandomFromArray(names.Warforged);
		case 'Yuan-Ti Pureblood' :
			return GetGenderedName(names['Yuan-Ti'], characterOrSib.Gender);
	}
}

function FirstnameLastname(nameObj, lastnameType, gender)
{
	return GetGenderedName(nameObj, gender) + ' ' + RandomFromArray(nameObj[lastnameType]);
}

function RandomGender()
{
	return RandomFromArray(['Male', 'Female']);
}

function GetGenderedName(nameObj, gender)
{
	if(gender == 'Male' || gender == 'Female')
		return RandomFromArray(nameObj[gender]);
	return RandomFromArray(nameObj[RandomGender()]);
}

function GetHumanName(ethnicity, gender)
{
	return HumanFirstName(ethnicity, gender) + ' ' + HumanLastName(ethnicity);
}

function HumanFirstName(ethnicity, gender)
{
	if(ethnicity == 'Tethyrian')
		return GetGenderedName(names.Human.Chondathan, gender);
	return GetGenderedName(names.Human[ethnicity], gender);
}

function HumanLastName(ethnicity)
{
	if(ethnicity == 'Bedine')
		return RandomFromArray(names.Human.Bedine.Tribe);
	if(ethnicity == 'Tethyrian')
		return RandomFromArray(names.Human.Chondathan.Surname);
	if(ethnicity == 'Tuigan' || ethnicity == 'Ulutiun')
		return '';
	return RandomFromArray(names.Human[ethnicity].Surname);
}

function RandomEthnicity()
{
	return GetProperties(races[7]['Subraces and Variants'].Ethnicity, true);
}

// For half-elves and half-orcs
function GetHumanEthnicity()
{
	var ethnicity = character.Race['Subraces and Variants']['Human Heritage'];
	if(ethnicity == 'Unknown')
		ethnicity = RandomEthnicity();
	return ethnicity;
}

function GetCharacteristics(propObj)	// Compute age, height, and weight
{
	var chaObj = {};
	chaObj.Age = RandomNum(propObj.maxage - propObj.minage) + propObj.minage;
	if(chaObj.Age == '1')
		chaObj.Age += ' year'	// Extremely rare edge case but it can happen
	else
		chaObj.Age += ' years';
	var heightmod = DiceRoll(propObj.heightmod), intHeight = propObj.baseheight + heightmod;
	chaObj.Height = Math.floor(intHeight / 12) + '\'' + (intHeight % 12) + '"';
	chaObj.Weight = propObj.baseweight + heightmod * DiceRoll(propObj.weightmod) + ' lbs.';
	chaObj = Object.assign(chaObj, GetProperties(propObj.other, true));
	return chaObj;
}

function BackgroundTraits(propObj, num)	// Assign background traits
{
	var baseBackground = backgrounds[num];
	var newProp = Object.assign( {}, propObj )
	delete newProp._special;
	var traits = Object.assign( {}, GetProperties(newProp, true),
	(
		{
			'Trait' : RandomFromArray(baseBackground.Personality.Trait),
			'Ideal' : RandomFromArray(baseBackground.Personality.Ideal),
			'Bond' : RandomFromArray(baseBackground.Personality.Bond),
			'Flaw' : RandomFromArray(baseBackground.Personality.Flaw)
		}
	));
	return traits;
}

function GetStats()
{
	var stats = {};
	stats.Strength = '10';
	stats.Dexterity = '10';
	stats.Constitution = '10';
	stats.Intelligence = '10';
	stats.Wisdom = '10';
	stats.Charisma = '10';
	return stats;
}

function GetLifeEvents()
{
	var lifeEvents = {};
	var numEvents = 3 + RandomNum(3);
	for(var eventNum = 0; eventNum < numEvents; eventNum++)
	{
		do {
			var newEventType = '', randomEventNum = RandomNum(100);
			if(randomEventNum == 99)
				newEventType = 'Weird Stuff';
			else
				newEventType = eventTables['Life Events'][Math.floor(randomEventNum / 5)];
		} while(lifeEvents.hasOwnProperty([newEventType]))
		
		var newEvent = '';
		switch (newEventType)
		{
			case 'Marriage' :
				var spouseRace;
				if(RandomNum(3) < 2)
					spouseRace = character.Race._name;
				else
					spouseRace = GetRaceWeighted();
				newEvent = 'You fell in love or got married to a(n) ' + spouseRace.toLowerCase() + ' ' + GetOccupation().toLowerCase() + '.';
				break;
			case 'Friend' :
				newEvent = 'You made a friend of a(n) ' + GetRaceWeighted().toLowerCase() + ' ' + GetClassWeighted().toLowerCase() + '.';
				break;
			case 'Enemy' :
				newEvent = 'You made an enemy of a(n) ' + GetRaceWeighted().toLowerCase() + ' ' + GetClassWeighted().toLowerCase() + '. Roll a d6. An odd number indicates you are to blame for the rift, and an even number indicates you are blameless.';
				break;
			case 'Job' :
				newEvent = 'You spent time working in a job related to your background. Start the game with an extra 2d6 gp.';
				break;
			case 'Someone Important' :
				newEvent = 'You met an important ' + GetRaceWeighted().toLowerCase() + ', who is ' + GetRelationship().toLowerCase() + ' towards you.';
				break;
			case 'Adventure' :
				var rand = RandomNum(100);
				if(rand == 99)
					newEvent = eventTables.Adventure[10];
				else
					newEvent = eventTables.Adventure[Math.floor(rand/10)];
				break;
			case 'Crime' :
					newEvent = RandomFromArray(eventTables.Crime) + '. ' + RandomFromArray(eventTables.Punishment);
				break;
			default:
				newEvent = RandomFromArray(eventTables[newEventType]);
				break;
		}
		lifeEvents[newEventType] = newEvent;
	}
	return lifeEvents;
}

function FinishLife()
{
	var raisedBy = GetRaisedBy();
	character.Life.Origin['Raised By'] = raisedBy;
	if(raisedBy == 'Mother and father')
		delete character.Life.Origin['Absent Parent(s)'];
	else
		character.Life.Origin['Absent Parent(s)'] = GetAbsentParent();
	var lifestyle = GetLifestyle();
	character.Life.Origin['Family Lifestyle'] = lifestyle[0];
	character.Life.Origin['Childhood Home'] = GetHome(lifestyle[1]);
	character.Life.Origin['Childhood Memories'] = GetMemories();
	var siblings = GetSiblings();
	if(siblings == "None")
		delete character.Life.Origin.Siblings;
	else
		character.Life.Origin.Siblings = siblings;
	character.Life['Life Events'] = GetLifeEvents();
}

function GetSiblings()	// Determine who our siblings are
{
	var numSiblings = RandomNum(3);
	if (numSiblings == 0)
	{
		delete character.Life.Origin.Siblings;
		return 'None';
	}
	siblings = {};
	for(var sibNum = 0; sibNum < numSiblings; sibNum++)
	{
		var newSib = { _name: '' };
		newSib.Gender = RandomFromArray(genders);
		newSib.Race = GetSiblingRace(character.Race._name);
		newSib._name = GetSiblingName(newSib);
		while(newSib._name == character._name.substring(0, newSib._name.length))
			newSib._name = GetSiblingName(newSib);
		newSib.Alignment = GetAlignment();
		newSib.Occupation = GetOccupation();
		newSib.Status = GetStatus();
		
		newSib.Relationship = GetRelationship();
		
		var birthOrderRoll = DiceRoll('2d6');
		if(newSib.Race == 'Warforged')
		{
			delete newSib.Gender;
			if(birthOrderRoll < 3)
				newSib['Order of Construction'] = 'Simultaneous';
			else if(birthOrderRoll < 8)
				newSib['Order of Construction'] = 'Older';
			else
				newSib['Order of Construction'] = 'Younger';
		}
		else
		{
			if(birthOrderRoll < 3)
				newSib['Birth Order'] = 'Twin, triplet, or quadruplet';
			else if(birthOrderRoll < 8)
				newSib['Birth Order'] = 'Older';
			else
				newSib['Birth Order'] = 'Younger';
		}
		siblings[newSib._name] = newSib;
	}
	return siblings;
}

function GetSiblingRace(race) 	// If mixed-race, determine races of siblings
{
	var parents = character.Life.Origin.Parents;
	switch(race)
	{
		case 'Half-Elf' :
			if(parents == 'One parent was an elf and the other was a half-elf.')
				return RandomFromArray([ 'Elf', 'Half-Elf' ]);
			if(parents == 'One parent was a human and the other was a half-elf.')
				return RandomFromArray([ 'Human', 'Half-Elf' ]);
			return 'Half-Elf';
		case 'Half-Orc' :
			if(parents == 'One parent was an orc and the other was a half-orc.')
				return RandomFromArray([ 'Orc', 'Half-Orc' ]);
			if(parents == 'One parent was an human and the other was a half-orc.')
				return RandomFromArray([ 'Human', 'Half-Orc' ]);
			return 'Half-Orc';
		case 'Tiefling' :
			if(parents == 'Both parents were humans, their infernal heritage dormant until you came along.')
				return RandomFromArray([ 'Human', 'Human', 'Human', 'Tiefling' ]);
			if(parents == 'One parent was a tiefling and the other was a human.')
				return RandomFromArray([ 'Human', 'Tiefling' ]);
			return 'Tiefling';
		case 'Genasi' :
			if(parents == 'One parent was a genasi and the other was a human.')
				return RandomFromArray([ 'Human', 'Genasi' ]);
			if(parents == 'Both parents were humans, their elemental heritage dormant until you came along.')
				return RandomFromArray([ 'Human', 'Human', 'Human', 'Genasi' ]);
			return 'Genasi';
		case 'Aasimar' :
			if(parents == 'Both parents were humans, their celestial heritage dormant until you came along.')
				return 'Human';
			return RandomFromArray([ 'Human', 'Aasimar' ]);
	}
	return race;
}

function GetSiblingName(sibling)
{
	var name = '';
	if(sibling.Race == 'Tabaxi')
		return RandomFromArray(names.Tabaxi.Name);
	else if(sibling.Race == 'Human' && character.Race._name != 'Human')
	{
		var ethnicity = character.Race['Subraces and Variants']['Human Heritage'];
		if(ethnicity == 'Unknown')
			ethnicity = RandomEthnicity();
		name = GetHumanName(ethnicity, sibling.Gender);
	}
	else
		name = GetName(sibling.Race, sibling);
	var lastSpace = name.lastIndexOf(' ');
	if(lastSpace < 0)
		return name;
	return name.substring(0, lastSpace);
}

function GetRaceWeighted()
{
	raceWeightList = Object.assign({}, raceWeights);
	totalWeight = 95;
	for(var raceIndex in races)
	{
		var race = races[raceIndex];
		var bookString = GetBookString(race._special);
		if(bookString == 'PHB' || !CheckHasBook(bookString))
			continue;
		raceWeightList[race._name] = 1;
		totalWeight += 1;
	}
	var rand = RandomNum(totalWeight);
	for(var race in raceWeightList)
	{
		rand -= raceWeightList[race];
		if(rand <= 0)
			return race;
	}
}

function GetAlignment()
{
	var roll = DiceRoll('3d6');
	if(roll < 4)
		return RandomFromArray(['Chaotic Evil', 'Chaotic Neutral']);
	if(roll < 6)
		return 'Lawful Evil';
	if(roll < 9)
		return 'Neutral Evil';
	if(roll < 13)
		return 'Neutral';
	if(roll < 16)
		return 'Neutral Good';
	if(roll < 17)
		return 'Lawful Good';
	if(roll < 18)
		return 'Lawful Neutral';
	return RandomFromArray(['Chaotic Good', 'Chaotic Neutral']);
}

function GetOccupation()
{
	var rand = RandomNum(100);
	if(rand < 5)
		return 'Academic';
	if(rand < 10)
		return 'Adventurer (' + GetClassWeighted() + ')';
	if(rand < 11)
		return 'Aristocrat';
	if(rand < 26)
		return 'Artisan or guild member';
	if(rand < 31)
		return 'Criminal';
	if(rand < 36)
		return 'Entertainer';
	if(rand < 38)
		return 'Exile, hermit, or refugee';
	if(rand < 43)
		return 'Explorer or wanderer';
	if(rand < 55)
		return 'Farmer or herder';
	if(rand < 60)
		return 'Hunter or trapper';
	if(rand < 75)
		return 'Laborer';
	if(rand < 80)
		return 'Merchant';
	if(rand < 85)
		return 'Politician or bureaucrat';
	if(rand < 90)
		return 'Priest';
	if(rand < 95)
		return 'Sailor';
	if(rand < 100)
		return 'Soldier';
}

function GetClassWeighted()
{
	var rand = RandomNum(115);
	if(rand < 7)
		return 'Barbarian';
	if(rand < 14)
		return 'Bard';
	if(rand < 29)
		return 'Cleric';
	if(rand < 36)
		return 'Druid';
	if(rand < 52)
		return 'Fighter';
	if(rand < 58)
		return 'Monk';
	if(rand < 64)
		return 'Paladin';
	if(rand < 70)
		return 'Ranger';
	if(rand < 84)
		return 'Rogue';
	if(rand < 89)
		return 'Sorcerer';
	if(rand < 94)
		return 'Warlock';
	if(rand < 100)
		return 'Wizard';
	if(rand < 105)
	{
		if (books.indexOf('Unofficial' >= 0))
			return 'Blood Hunter';
		return GetClassWeighted();
	}
	if(rand < 110)
	{
		if(books.indexOf('UA' >= 0))
			return 'Artificer';
		return GetClassWeighted();
	}
	if(books.indexOf('UA' >= 0))
		return 'Mystic';
	return GetClassWeighted();
}

function GetStatus()
{
	var roll = DiceRoll('3d6');
	if(roll < 4)
		return 'Dead (roll on the Cause of Death table)'
	if(roll < 6)
		return 'Missing or unknown'
	if(roll < 9)
		return 'Alive, but doing poorly due to injury, financial trouble, or relationship difficulties'
	if(roll < 13)
		return 'Alive and well'
	if(roll < 16)
		return 'Alive and quite successful'
	if(roll < 18)
		return 'Alive and infamous'
	return 'Alive and famous'
}

function GetRaisedBy()
{
	var rand = RandomNum(100);
	if(rand < 1)
		return 'Nobody';
	if(rand < 2)
		return 'Institution, such as an asylum';
	if(rand < 3)
		return 'Temple';
	if(rand < 5)
		return 'Orphanage';
	if(rand < 7)
		return 'Guardian';
	if(rand < 15)
		return 'Paternal or maternal aunt, uncle, or both; or extended family such as a tribe or clan';
	if(rand < 25)
		return 'Paternal or maternal grandparent(s)';
	if(rand < 35)
		return 'Adoptive family (same or different race)';
	if(rand < 55)
		return 'Single father or stepfather';
	if(rand < 75)
		return 'Single mother or stepmother';
	return 'Mother and father';
}

function GetAbsentParent()
{
	var rand = RandomNum(4);
	if(rand < 1)
		return 'Your parent(s) died';
	if(rand < 2)
		return 'Your parent(s) was/were imprisoned, enslaved, or otherwise taken away';
	if(rand < 3)
		return 'Your parent(s) abandoned you';
	return 'Your parent(s) disappeared to an unknown fate';
}

function GetLifestyle()
{
	var roll = DiceRoll('3d6');
	if(roll < 4)
		return [ 'Wretched', -40 ];
	if(roll < 6)
		return [ 'Squalid', -20 ];
	if(roll < 9)
		return [ 'Poor', -10 ];
	if(roll < 13)
		return [ 'Modest', 0 ];
	if(roll < 16)
		return [ 'Comfortable', 10 ];
	if(roll < 18)
		return [ 'Wealthy', 20 ];
	return [ 'Aristocratic', 40 ];
}

function GetHome(lifeMod)
{
	var rand = RandomNum(100) + lifeMod;
	if(rand < 0)
		return 'On the streets';
	if(rand < 20)
		return 'Rundown shack';
	if(rand < 30)
		return 'No permanent residence, you moved around a lot';
	if(rand < 40)
		return 'Encampment of village in the wilderness';
	if(rand < 50)
		return 'Apartment in a rundown neighborhood';
	if(rand < 70)
		return 'Small house';
	if(rand < 90)
		return 'Large house';
	if(rand < 110)
		return 'Mansion';
	return 'Palace or Castle';
}

function GetMemories()
{
	var roll = DiceRoll('3d6') + RandomNum(5) - 1;
	if(roll < 4)
		return 'I am still haunted by my childhood, when I was treated badly by my peers';
	if(roll < 6)
		return 'I spent most of my childhood alone, with no close friends';
	if(roll < 9)
		return 'Others saw me as being different or strange, and so I had few companions';
	if(roll < 13)
		return 'I had a few close friends and lived an ordinary childhood.';
	if(roll < 16)
		return 'I had several friends, and my childhood was generally a happy one.';
	if(roll < 18)
		return 'I always found it easy to make friends, and I loved being around people.';
	return 'Everyone knew who I was, and I had friends everywhere I went.';
}

function GetRelationship()
{
	var roll = DiceRoll('3d4');
	if(roll < 5)
		return 'Hostile';
	else if(roll < 11)
		return 'Friendly';
	return 'Indifferent';
}

function RandomNum(max)	// Generate random number
{
	return Math.floor(Math.random() * max);
}

function RandomFromArray(arr)	// Pick a random element from an array
{
	return arr[RandomNum(arr.length)];
}

function RandomFromArrayCheckBooks(arr)
{
	var returnArray = [];
	for(var index in arr)
	{
		var item = arr[index];
		if(typeof item == 'object')
		{
			if(item.hasOwnProperty('_special'))
			{
				if(!CheckHasBook(GetBookString(item._special)))
					continue;
			}
		}
		returnArray.push(index);
	}
	return RandomFromArray(returnArray);
}

function RandomFromArrayMultiple(arr, num)	// Pick multiple random elements from an array
{
	var returnArray = [];
	while(returnArray.length < num)
	{
		var item = RandomFromArray(arr);
		if(returnArray.indexOf(item) < 0)
			returnArray.push(item);
	}
	return returnArray.join(', ');
}

function RandomFromBookArray(bookList)	// Pick a random element from a list of book arrays
{
	var bookListWeights = [];
	var totalWeight = 0;
	for(var bookName in bookList)
	{
		for(var bookNum in books)
		{
			if(bookName.indexOf(books[bookNum]) >= 0)
			{
				var weight = bookList[bookName].length;
				bookListWeights.push({ 'name' : bookName, 'weight' : weight });
				totalWeight += weight;
				continue;
			}
		}
	}
	var randomNum = RandomNum(totalWeight);
	var bookNum = 0;
	while(randomNum >= bookListWeights[bookNum].weight)
	{
		randomNum -= bookListWeights[bookNum].weight;
		bookNum++;
	}
	return bookList[bookListWeights[bookNum].name][randomNum];
}

function DiceRoll(roll)	// Roll dice based on a string (eg. '2d6')
{
	numbers = roll.split('d');
	if(numbers.length == 1)
		return numbers[0];
	var total = 0;
	for(die = 0; die < numbers[0]; die++)
		total += RandomNum(numbers[1]) + 1;
	return total;
}

function CheckHasBook(book)
{
	if(book == null)
		return true;
	for(var index in books)
	{
		if(book.indexOf(books[index]) >= 0)
			return true;
	}
	return false;
}
	
function GetBookString(string)
{
	if(string.substring(0, 5) != 'book-')
		return null;
	var spaceIndex = string.indexOf(' ');
	if(spaceIndex < 0)
		bookString = string.substring(5);
	else
		bookString = string.substring(5, spaceIndex);
	return bookString;
}