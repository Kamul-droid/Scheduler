.PHONY: test test-unit test-integration test-cov install clean

install:
	pip install -r requirements.txt
	pip install pytest pytest-cov pytest-asyncio httpx

test:
	pytest

test-unit:
	pytest -m "not integration and not slow"

test-integration:
	pytest -m integration

test-cov:
	pytest --cov=src --cov-report=html --cov-report=term-missing

clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info

