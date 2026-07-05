#!/usr/bin/env python3
"""Tests unitarios para normalización de temporadas e import idempotente."""

import unittest

from import_data import normalize_seasons_from_export, watch_status_from_seasons


class NormalizeSeasonsTest(unittest.TestCase):
    def test_skips_season_zero_and_specials(self):
        raw = [
            {
                "number": 0,
                "is_specials": True,
                "episodes": [{"number": 23, "special": True, "is_watched": False}],
            },
            {
                "number": 1,
                "is_specials": False,
                "episodes": [
                    {"number": 1, "special": False, "is_watched": True},
                    {"number": 2, "special": False, "is_watched": False},
                ],
            },
        ]
        seasons = normalize_seasons_from_export(raw)
        self.assertEqual(len(seasons), 1)
        self.assertEqual(seasons[0]["season_number"], 1)
        self.assertEqual(seasons[0]["episode_count"], 2)
        self.assertEqual(seasons[0]["watched_episodes"], [1])

    def test_watch_status_ignores_specials(self):
        raw = [
            {
                "number": 0,
                "is_specials": True,
                "episodes": [{"number": 1, "special": True, "is_watched": True}],
            },
            {
                "number": 1,
                "is_specials": False,
                "episodes": [{"number": 1, "special": False, "is_watched": True}],
            },
        ]
        status, seasons = watch_status_from_seasons(raw)
        self.assertEqual(status, "visto")
        self.assertEqual(len(seasons), 1)

    def test_viendo_when_partial(self):
        raw = [
            {
                "number": 1,
                "is_specials": False,
                "episodes": [
                    {"number": 1, "special": False, "is_watched": True},
                    {"number": 2, "special": False, "is_watched": False},
                ],
            },
        ]
        status, _ = watch_status_from_seasons(raw)
        self.assertEqual(status, "viendo")


if __name__ == "__main__":
    unittest.main()
