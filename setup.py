#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

setup(
    name="inginious-problems-demo",
    version="0.1dev0",
    description="Plugin to add demo problem type",
    packages=find_packages(),
    install_requires=["inginious>=0.5.dev0"],
    tests_require=[],
    extras_require={},
    scripts=[],
    include_package_data=True,
    author="The INGInious authors",
    author_email="inginious@info.ucl.ac.be",
    license="AGPL 3",
    url="https://github.com/UCL-INGI/INGInious-problems-demo"
)
