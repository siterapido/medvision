import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock environment variables
os.environ["SUPABASE_DB_URL"] = "postgresql://mock:mock@localhost:5432/mock"
os.environ["OPENROUTER_API_KEY"] = "mock_key"
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "mock_key"


class TestSummaryAgent(unittest.TestCase):
    def setUp(self):
        # Clean up modules
        modules_to_clean = [
            "app.agents.summary_agent",
            "app.tools.artifacts_db",
            "agno.tools",
        ]
        for mod in modules_to_clean:
            if mod in sys.modules:
                del sys.modules[mod]

    def test_agent_initialization_instructions(self):
        # We need to mock OpenAILike to pass isinstance checks if agno checks types strictly
        # Or easier: Mock the Agent class itself so we inspect what it was initialized WITH

        with (
            patch("app.database.supabase.get_agent_config") as mock_get_config,
            patch("app.database.supabase.get_supabase_connection") as mock_get_conn,
            patch("agno.db.postgres.PostgresDb") as mock_db,
            patch("app.agents.summary_agent.OpenAILike") as mock_llm_cls,
            patch("app.agents.summary_agent.Agent") as mock_agent_cls,
        ):
            mock_get_config.return_value = {}

            # Setup Model Mock to avoid validation errors if Agent.__init__ logic runs
            mock_llm_instance = MagicMock()
            mock_llm_cls.return_value = mock_llm_instance

            # Capture the agent instance created
            mock_agent_instance = MagicMock()
            mock_agent_cls.return_value = mock_agent_instance

            # Import and run
            from app.agents.summary_agent import create_summary_agent

            agent = create_summary_agent()

            # Verify Agent was initialized with correct params
            args, kwargs = mock_agent_cls.call_args

            # kwargs should contain instructions
            instructions = kwargs.get("instructions", [])
            instructions_str = " ".join(instructions)
            description = kwargs.get("description", "")

            # Verify Name
            self.assertEqual(kwargs.get("name"), "odonto-summary")

            # Verify Content
            self.assertIn("Active Recall", description)
            self.assertIn("DO NOT WRITE THE CONTENT IN THE CHAT", instructions_str)
            self.assertIn("JSON Tree Object", instructions_str)
            self.assertIn("JSON List of Objects", instructions_str)

            print(
                "\n✅ Agent Initialization & Instructions Verified via Mock Inspection"
            )

    def test_save_flashcards_structure(self):
        # 1. Disable the @tool decorator effectively
        with patch("agno.tools.tool", side_effect=lambda x: x):
            # 2. Reload module to apply the no-op decorator
            if "app.tools.artifacts_db" in sys.modules:
                del sys.modules["app.tools.artifacts_db"]

            import app.tools.artifacts_db

            # 3. Patch the client getter ON THE RELOADED MODULE
            with patch.object(
                app.tools.artifacts_db, "_get_supabase_client"
            ) as mock_get_client:
                mock_supabase = MagicMock()
                mock_get_client.return_value = mock_supabase
                mock_table = MagicMock()
                mock_supabase.table.return_value = mock_table
                mock_insert = MagicMock()
                mock_table.insert.return_value = mock_insert
                mock_execute = MagicMock()
                mock_insert.execute.return_value = mock_execute

                # Mock response
                mock_execute.data = [{"id": "123-test-id"}]

                # Execute tool
                cards = [{"front": "Q", "back": "A"}]
                result = app.tools.artifacts_db.save_flashcards(
                    user_id="u1", title="T1", cards=cards, topic="Gen"
                )

                # Verify
                mock_table.insert.assert_called_once()
                call_args = mock_table.insert.call_args[0][0]
                self.assertEqual(call_args["cards"], cards)
                self.assertIn("123-test-id", result)
                print("\n✅ save_flashcards tool verified")

    def test_save_mind_map_structure(self):
        with patch("agno.tools.tool", side_effect=lambda x: x):
            if "app.tools.artifacts_db" in sys.modules:
                del sys.modules["app.tools.artifacts_db"]

            import app.tools.artifacts_db

            with patch.object(
                app.tools.artifacts_db, "_get_supabase_client"
            ) as mock_get_client:
                mock_supabase = MagicMock()
                mock_get_client.return_value = mock_supabase
                mock_table = MagicMock()
                mock_supabase.table.return_value = mock_table
                mock_insert = MagicMock()
                mock_table.insert.return_value = mock_insert
                mock_execute = MagicMock()
                mock_insert.execute.return_value = mock_execute

                mock_execute.data = [{"id": "map-123"}]

                map_data = {"name": "Root", "children": []}
                result = app.tools.artifacts_db.save_mind_map(
                    user_id="u1", title="M1", map_data=map_data, topic="Gen"
                )

                mock_table.insert.assert_called_once()
                self.assertEqual(mock_table.insert.call_args[0][0]["data"], map_data)
                self.assertIn("map-123", result)
                print("\n✅ save_mind_map tool verified")


if __name__ == "__main__":
    unittest.main()
