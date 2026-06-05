import { helpers } from "./helpers.ts";
import type { ImportPlayerRules } from "./types.ts";

type PlayerWithBornLoc = {
	born: {
		loc?: string;
	};
};

export type ImportLimitViolation = {
	count: number;
	limit: number;
	message: string;
};

const isImportPlayerRulesEnabled = (
	rules?: ImportPlayerRules,
): rules is ImportPlayerRules => {
	return rules?.enabled === true;
};

const getDomesticCountries = (rules: ImportPlayerRules) => {
	return new Set(
		rules.domesticCountries.map((country) => helpers.getCountry(country)),
	);
};

export const getPlayerCountry = (p: PlayerWithBornLoc) => {
	return helpers.getCountry(p.born.loc);
};

export const isImportedPlayer = (
	p: PlayerWithBornLoc,
	rules?: ImportPlayerRules,
) => {
	if (!isImportPlayerRulesEnabled(rules)) {
		return false;
	}

	return !getDomesticCountries(rules).has(getPlayerCountry(p));
};

export const countImportedPlayers = (
	players: PlayerWithBornLoc[],
	rules?: ImportPlayerRules,
) => {
	if (!isImportPlayerRulesEnabled(rules)) {
		return 0;
	}

	return players.filter((p) => isImportedPlayer(p, rules)).length;
};

export const getImportLimitViolation = (
	players: PlayerWithBornLoc[],
	rules?: ImportPlayerRules,
): ImportLimitViolation | undefined => {
	if (!isImportPlayerRulesEnabled(rules)) {
		return;
	}

	const limit = rules.maxImportedPlayersPerRoster;
	if (limit === null) {
		return;
	}

	const count = countImportedPlayers(players, rules);
	if (count <= limit) {
		return;
	}

	return {
		count,
		limit,
		message: `Roster has ${count} imported players, which exceeds the limit of ${limit}.`,
	};
};

export const canAddPlayerUnderImportRules = (
	players: PlayerWithBornLoc[],
	p: PlayerWithBornLoc,
	rules?: ImportPlayerRules,
) => {
	return getImportLimitViolation([...players, p], rules) === undefined;
};
