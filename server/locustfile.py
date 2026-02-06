from locust import HttpUser, task

class PressEndpointTasks(HttpUser):
    @task
    def press(self):
        self.client.post("/press")
