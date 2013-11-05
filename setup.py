#!/usr/bin/python
#

"""
Setup file to package EDS Calendar Integration
"""

from distutils.core import setup
from DistUtilsExtra.command import build_extra
import shutil
import os

shutil.make_archive("{e6696d02-466a-11e3-a162-04e36188709b}.xpi", "zip", "src")
os.rename("{e6696d02-466a-11e3-a162-04e36188709b}.xpi.zip", "{e6696d02-466a-11e3-a162-04e36188709b}.xpi")

setup(name="xul-ext-eds-calendar",
      version="0.1",
      author="Mateusz Balbus",
      author_email="balbusm@gmail.com",
      url="https://addons.mozilla.org/en-US/thunderbird/addon/eds-calenadr/",
      license="GNU General Public License Version 2 (GPLv2)",
      data_files=[
        ("/usr/lib/mozilla/extensions/{3550f703-e582-4d05-9a08-453d09bdfdc6}", ['{e6696d02-466a-11e3-a162-04e36188709b}.xpi', ]),
      ],
      cmdclass={"build": build_extra.build_extra, }
)
