from agno.agent import Agent, Toolkit
from app.database.supabase import get_user_profile, get_user_recent_artifacts
import json


class MemoryToolkit(Toolkit):
    def __init__(self):
        super().__init__(name="memory_toolkit")
        self.register(self.get_student_profile)
        self.register(self.get_recent_studies)

    def get_student_profile(self, user_id: str) -> str:
        """
        Retrieves the student's profile (semester, specialty, interests).
        Use this to adapt your explanation level (ZPD).

        Args:
            user_id: The ID of the current user.
        """
        profile = get_user_profile(user_id)
        if not profile:
            return "Profile not found. Treat as general dental student."
        return json.dumps(profile, default=str)

    def get_recent_studies(self, user_id: str) -> str:
        """
        Retrieves recent artifacts (summaries, research) the user created.
        Use this to reference past activities ("I saw you studied Endodontics yesterday...").

        Args:
            user_id: The ID of the current user.
        """
        artifacts = get_user_recent_artifacts(user_id)
        if not artifacts:
            return "No recent study artifacts found."
        return json.dumps(artifacts, default=str)
