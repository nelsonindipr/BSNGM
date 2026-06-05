import { assert, describe, test } from "vitest";
import {
	canAddPlayerUnderImportRules,
	countImportedPlayers,
	getImportLimitViolation,
	getPlayerCountry,
	isImportedPlayer,
} from "./importPlayerRules.ts";
import type { ImportPlayerRules } from "./types.ts";

const player = (loc: string) => ({
	born: {
		loc,
	},
});

const rules: ImportPlayerRules = {
	enabled: true,
	domesticCountries: ["Puerto Rico", "USA"],
	maxImportedPlayersPerRoster: 2,
};

describe("importPlayerRules", () => {
	test("treat undefined or disabled rules as no restriction", () => {
		const importedPlayer = player("Madrid, Spain");

		assert.strictEqual(isImportedPlayer(importedPlayer), false);
		assert.strictEqual(countImportedPlayers([importedPlayer]), 0);
		assert.strictEqual(
			getImportLimitViolation([importedPlayer, importedPlayer]),
			undefined,
		);
		assert.strictEqual(
			canAddPlayerUnderImportRules([importedPlayer], importedPlayer),
			true,
		);

		const disabledRules = {
			...rules,
			enabled: false,
		};
		assert.strictEqual(isImportedPlayer(importedPlayer, disabledRules), false);
		assert.strictEqual(countImportedPlayers([importedPlayer], disabledRules), 0);
	});

	test("allows unlimited imported players when the roster limit is null", () => {
		const unlimitedRules = {
			...rules,
			maxImportedPlayersPerRoster: null,
		};
		const players = [
			player("Madrid, Spain"),
			player("Santo Domingo, Dominican Republic"),
			player("Paris, France"),
		];

		assert.strictEqual(
			getImportLimitViolation(players, unlimitedRules),
			undefined,
		);
		assert.strictEqual(
			canAddPlayerUnderImportRules(
				players,
				player("Berlin, Germany"),
				unlimitedRules,
			),
			true,
		);
	});

	test("uses helpers.getCountry-style country normalization", () => {
		assert.strictEqual(getPlayerCountry(player("California")), "USA");
		assert.strictEqual(getPlayerCountry(player("Toronto, Canada")), "Canada");
		assert.strictEqual(getPlayerCountry(player("Madrid, Spain")), "Spain");
	});

	test("matches domestic countries before classifying players as imported", () => {
		assert.strictEqual(
			isImportedPlayer(player("San Juan, Puerto Rico"), rules),
			false,
		);
		assert.strictEqual(isImportedPlayer(player("California"), rules), false);
		assert.strictEqual(
			isImportedPlayer(player("Santo Domingo, Dominican Republic"), rules),
			true,
		);
	});

	test("counts imported players", () => {
		const players = [
			player("San Juan, Puerto Rico"),
			player("California"),
			player("Madrid, Spain"),
			player("Santo Domingo, Dominican Republic"),
		];

		assert.strictEqual(countImportedPlayers(players, rules), 2);
	});

	test("reports roster-limit violations", () => {
		const players = [
			player("Madrid, Spain"),
			player("Santo Domingo, Dominican Republic"),
			player("Paris, France"),
		];

		assert.deepStrictEqual(getImportLimitViolation(players, rules), {
			count: 3,
			limit: 2,
			message: "Roster has 3 imported players, which exceeds the limit of 2.",
		});
	});

	test("checks whether adding a player would exceed roster import limits", () => {
		const roster = [player("Madrid, Spain"), player("San Juan, Puerto Rico")];

		assert.strictEqual(
			canAddPlayerUnderImportRules(roster, player("California"), rules),
			true,
		);
		assert.strictEqual(
			canAddPlayerUnderImportRules(roster, player("Paris, France"), rules),
			true,
		);
		assert.strictEqual(
			canAddPlayerUnderImportRules(
				[...roster, player("Paris, France")],
				player("Berlin, Germany"),
				rules,
			),
			false,
		);
	});
});
